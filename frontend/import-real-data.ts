// scripts/import-real-data.ts
//
// One-time loader: pushes Hoàng Phát's real Excel exports onto the `dev` Neon branch.
// Run with: pnpm tsx scripts/import-real-data.ts
//
// Expects the 4 source files in scripts/data/ (adjust DATA_DIR below if you keep them
// elsewhere):
//   Danh_sach_hang_hoa_dich_vu.xlsx           product catalog + current stock
//   Danh_sach_khach_hang.xlsx                 customers
//   Danh_sach_nha_cung_cap.xlsx                suppliers
//   Tong_hop_ton_kho-37.xlsx                   N-X-T report, Kho: KHO HÀNG HÓA
//   Tong_hop_ton_kho-Hoàng-Phát-Kho-KM-24-07.xlsx   N-X-T report, Kho: KHO KHUYẾN MẠI
//
// Requires the `xlsx` package: pnpm add -D xlsx
//
// Safe to re-run: products/customers/suppliers/warehouses are skipped (not duplicated)
// if a row with the same natural key already exists. Re-running does NOT re-derive
// inventory_transactions for a product that already has some — if you need a clean
// reload, TRUNCATE the relevant tables first (see the note at the very end of this file).
//
// ---------------------------------------------------------------------------
// DECISIONS BAKED INTO THIS SCRIPT — confirm before trusting this beyond the dev branch
// ---------------------------------------------------------------------------
// 1. Categories: none of the source files have usable business categories (the
//    catalog's "Nhóm VTHH" column is blank on half the rows). This script creates
//    three coarse categories from the product-code prefix (HH/DV/CP) instead of
//    reusing DEFAULT_CATEGORIES in categories.ts, which are leftover
//    industrial-parts demo categories with no relevance to an oil distributor.
//    Finer categorization (motor oil vs. gear oil vs. grease) needs a human pass
//    over product names — not attempted here.
// 2. products.price: NONE of the 4 files contain a selling price — only inventory
//    value and average cost. Every imported product lands at price = 0 (the
//    schema's NOT NULL default) until a price list is loaded separately.
// 3. products.warehouseId for DV*/CP* codes (freight line item, purchase-cost line
//    item — not physical stock) defaults to KHO HÀNG HÓA, since the column is
//    NOT NULL. This is a bookkeeping placeholder, not a claim these have a
//    physical location.
// 4. Customer/supplier "Công nợ" (opening debt / payable) columns are SKIPPED
//    entirely — not imported as synthetic invoices. A fake sales_invoices row per
//    customer would silently inflate every revenue report (reports.ts sums
//    salesInvoices.total unconditionally). There is currently no schema concept
//    for an opening balance (customer side) or any payable tracking at all
//    (supplier side) — that's a real gap, not something this script papers over.
//    Skipped totals are printed at the end so nothing goes untracked.
// 5. products.linkedProductId is left null for every row. ERD_CHUAN found 2 real
//    pairs (e.g. KM00028 / VT00069) by manual inspection — this script does not
//    attempt to auto-detect pairs from product names.
// 6. Three products (KM00008, KM00017, KM00034) genuinely disagree between the
//    catalog's current stock and the N-X-T report's closing balance — the two
//    source files were exported on different, unstated dates. This script trusts
//    the CATALOG figure as current truth and inserts one bridging `adjustment`
//    transaction per product so the ledger reconciles. Logged loudly, not
//    silently patched.
// ---------------------------------------------------------------------------

import path from "node:path";
import * as XLSX from "xlsx";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { warehouses, products, customers, suppliers, inventoryTransactions } from "@/server/db/schema";
import { getOrCreateCategoryByName } from "@/server/store/categories";

const DATA_DIR = path.resolve(process.cwd(), "scripts/data");

const FILES = {
  catalog: "Danh_sach_hang_hoa_dich_vu.xlsx",
  customers: "Danh_sach_khach_hang.xlsx",
  suppliers: "Danh_sach_nha_cung_cap.xlsx",
  stockHH: "Tong_hop_ton_kho-37.xlsx",
  stockKM: "Tong_hop_ton_kho-Hoàng-Phát-Kho-KM-24-07.xlsx",
};

const WAREHOUSE_HH = "KHO HÀNG HÓA";
const WAREHOUSE_KM = "KHO KHUYẾN MẠI";

const GROUP_CATEGORY_NAME: Record<"HH" | "DV" | "CP", string> = {
  HH: "Hàng hóa (dầu nhớt, mỡ bôi trơn...)",
  DV: "Dịch vụ",
  CP: "Chi phí",
};

function groupFromCode(code: string): "HH" | "DV" | "CP" {
  if (code.startsWith("VT") || code.startsWith("KM")) return "HH";
  if (code.startsWith("DV")) return "DV";
  return "CP";
}

function readRows(fileName: string): any[][] {
  const wb = XLSX.readFile(path.join(DATA_DIR, fileName));
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: null });
}

function toNum(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v.replace(/,/g, "")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toIntCostOrNull(v: unknown): number | null {
  const n = toNum(v);
  return n > 0 ? Math.round(n) : null;
}

// ---------------------------------------------------------------------------
// Parsers — row offsets are hardcoded from manual inspection of the real files.
// If the dev team's export format changes, these offsets need re-checking.
// ---------------------------------------------------------------------------

type CatalogRow = { code: string; name: string; unit: string; stock: number };

function parseCatalog(): CatalogRow[] {
  const rows = readRows(FILES.catalog);
  return rows
    .slice(3) // header is row index 2
    .filter((r) => r?.[1] && r[1] !== "Tổng")
    .map((r) => ({
      code: String(r[1]).trim(),
      name: String(r[2] ?? "").trim(),
      unit: String(r[5] ?? "Cái").trim() || "Cái",
      stock: toNum(r[6]),
    }));
}

type NxtRow = {
  warehouseName: string;
  code: string;
  openQty: number;
  openCost: number | null;
  importQty: number;
  importCost: number | null;
  exportQty: number;
  exportCost: number | null;
  closeQty: number;
};

function parseNxt(fileName: string): NxtRow[] {
  const rows = readRows(fileName);
  return rows
    .slice(9) // header groups at row 7, sub-header at row 8, data from row 9
    .filter((r) => r?.[1])
    .map((r) => ({
      warehouseName: String(r[0]).trim(),
      code: String(r[1]).trim(),
      openQty: toNum(r[4]),
      openCost: toIntCostOrNull(r[6]),
      importQty: toNum(r[7]),
      importCost: toIntCostOrNull(r[9]),
      exportQty: toNum(r[10]),
      exportCost: toIntCostOrNull(r[12]),
      closeQty: toNum(r[13]),
    }));
}

type PartyRow = { code: string; name: string; address: string | null; taxCode: string | null; phone: string | null; debt: number };

function parseParty(fileName: string): PartyRow[] {
  const rows = readRows(fileName);
  return rows
    .slice(3) // header is row index 2
    .filter((r) => r?.[1])
    .map((r) => ({
      code: String(r[1]).trim(),
      name: String(r[2] ?? "").trim(),
      address: r[3] ? String(r[3]).trim() : null,
      debt: toNum(r[4]),
      taxCode: r[5] ? String(r[5]).trim() : null,
      phone: r[6] ? String(r[6]).trim() : null,
    }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function getOrCreateWarehouse(name: string, allowsZeroValue: boolean) {
  const existing = await db.select().from(warehouses).where(eq(warehouses.name, name)).limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(warehouses).values({ name, allowsZeroValue }).returning();
  return row;
}

async function main() {
  console.log("=== 1. Warehouses ===");
  const whHH = await getOrCreateWarehouse(WAREHOUSE_HH, false);
  // C2 — promo warehouse allows zero-value rows (confirmed by real MISA data:
  // 29/38 KM rows are "has quantity, value = 0" as normal, not an error).
  const whKM = await getOrCreateWarehouse(WAREHOUSE_KM, true);
  console.log(`  ${WAREHOUSE_HH} -> ${whHH.id}`);
  console.log(`  ${WAREHOUSE_KM} -> ${whKM.id}`);

  console.log("\n=== 2. Categories ===");
  const categoryIds: Record<"HH" | "DV" | "CP", string> = {} as any;
  for (const [group, name] of Object.entries(GROUP_CATEGORY_NAME) as [keyof typeof GROUP_CATEGORY_NAME, string][]) {
    const cat = await getOrCreateCategoryByName(name);
    categoryIds[group] = cat.id;
    console.log(`  ${group} -> "${name}" -> ${cat.id}`);
  }

  console.log("\n=== 3. Reading N-X-T reports ===");
  const nxtHH = parseNxt(FILES.stockHH);
  const nxtKM = parseNxt(FILES.stockKM);
  const nxtByCode = new Map<string, NxtRow>();
  for (const r of [...nxtHH, ...nxtKM]) nxtByCode.set(r.code, r);
  console.log(`  HH warehouse: ${nxtHH.length} rows, KM warehouse: ${nxtKM.length} rows`);

  console.log("\n=== 4. Products ===");
  const catalog = parseCatalog();
  let productsInserted = 0;
  let productsSkipped = 0;
  const bridgedMismatches: { code: string; nxtClosing: number; catalogStock: number }[] = [];

  for (const row of catalog) {
    const existing = await db.select().from(products).where(eq(products.code, row.code)).limit(1);
    if (existing[0]) {
      productsSkipped++;
      continue;
    }

    const group = groupFromCode(row.code);
    const warehouseId = row.code.startsWith("KM") ? whKM.id : whHH.id; // DV*/CP* default to HH — see decision #3
    const nxt = nxtByCode.get(row.code);

    const [product] = await db
      .insert(products)
      .values({
        code: row.code,
        name: row.name,
        categoryId: categoryIds[group],
        warehouseId,
        unit: row.unit,
        stock: row.stock, // catalog is trusted as "current" — see decision #6
        price: 0, // see decision #2 — no selling price in any source file
        cost: nxt?.closeCost ?? nxt?.exportCost ?? null,
      })
      .returning();
    productsInserted++;

    if (!nxt) continue; // DV00001 / CPMH — no ledger history, stock is 0, nothing to write

    const txValues: (typeof inventoryTransactions.$inferInsert)[] = [];
    if (nxt.openQty !== 0) {
      txValues.push({
        productId: product.id,
        type: "adjustment",
        quantity: nxt.openQty,
        unitCost: nxt.openCost,
        note: "Tồn đầu kỳ theo báo cáo N-X-T (không có phiếu gốc)",
      });
    }
    if (nxt.importQty !== 0) {
      txValues.push({
        productId: product.id,
        type: "import",
        quantity: nxt.importQty,
        unitCost: nxt.importCost,
        note: "Nhập kho trong kỳ, tổng hợp từ báo cáo N-X-T (không có chi tiết từng phiếu)",
      });
    }
    if (nxt.exportQty !== 0) {
      txValues.push({
        productId: product.id,
        type: "export",
        quantity: -nxt.exportQty,
        unitCost: nxt.exportCost,
        note: "Xuất kho trong kỳ, tổng hợp từ báo cáo N-X-T (không có chi tiết từng phiếu)",
      });
    }

    // Decision #6 — bridge any gap between the N-X-T closing balance and the
    // catalog's current stock (different, unstated export dates).
    const ledgerCloseAfterTx = nxt.openQty + nxt.importQty - nxt.exportQty;
    const gap = row.stock - ledgerCloseAfterTx;
    if (Math.abs(gap) > 0.001) {
      bridgedMismatches.push({ code: row.code, nxtClosing: ledgerCloseAfterTx, catalogStock: row.stock });
      txValues.push({
        productId: product.id,
        type: "adjustment",
        quantity: gap,
        unitCost: null,
        note: `Điều chỉnh chênh lệch giữa báo cáo N-X-T (đóng kỳ: ${ledgerCloseAfterTx}) và danh mục hàng hóa hiện tại (${row.stock}) — hai file nguồn có ngày xuất khác nhau, chưa rõ nguyên nhân chênh lệch.`,
      });
    }

    if (txValues.length > 0) {
      await db.insert(inventoryTransactions).values(txValues);
    }
  }
  console.log(`  Inserted: ${productsInserted}, skipped (already existed): ${productsSkipped}`);
  if (bridgedMismatches.length > 0) {
    console.warn(`  ⚠ Bridged ${bridgedMismatches.length} catalog/N-X-T mismatches — review these manually:`);
    for (const m of bridgedMismatches) {
      console.warn(`    ${m.code}: N-X-T closing ${m.nxtClosing}, catalog stock ${m.catalogStock}`);
    }
  }

  console.log("\n=== 5. Customers ===");
  const customerRows = parseParty(FILES.customers);
  let customersInserted = 0;
  let skippedCustomerDebt = 0;
  for (const row of customerRows) {
    const existing = await db.select().from(customers).where(eq(customers.name, row.name)).limit(1);
    if (existing[0]) continue;
    await db.insert(customers).values({
      name: row.name,
      phone: row.phone,
      address: row.address,
      taxCode: row.taxCode,
      note: row.code, // MISA customer code (KH*) preserved for cross-reference, since schema has no dedicated column
    });
    customersInserted++;
    if (row.debt !== 0) skippedCustomerDebt += row.debt;
  }
  console.log(`  Inserted: ${customersInserted}`);
  if (skippedCustomerDebt !== 0) {
    console.warn(
      `  ⚠ Skipped ${skippedCustomerDebt.toLocaleString("vi-VN")} VNĐ of opening customer debt — see decision #4. Not imported anywhere.`,
    );
  }

  console.log("\n=== 6. Suppliers ===");
  const supplierRows = parseParty(FILES.suppliers);
  let suppliersInserted = 0;
  let skippedSupplierDebt = 0;
  for (const row of supplierRows) {
    if (!row.code.startsWith("NCC")) {
      console.warn(`  ⚠ Supplier "${row.name}" has a non-NCC code (${row.code}) — review before trusting this row.`);
    }
    const existing = await db.select().from(suppliers).where(eq(suppliers.name, row.name)).limit(1);
    if (existing[0]) continue;
    await db.insert(suppliers).values({
      name: row.name,
      phone: row.phone,
      address: row.address,
      taxCode: row.taxCode,
      note: row.code,
    });
    suppliersInserted++;
    if (row.debt !== 0) skippedSupplierDebt += row.debt;
  }
  console.log(`  Inserted: ${suppliersInserted}`);
  if (skippedSupplierDebt !== 0) {
    console.warn(
      `  ⚠ Skipped ${skippedSupplierDebt.toLocaleString("vi-VN")} VNĐ of opening supplier payables — see decision #4. There is currently no table for this at all.`,
    );
  }

  console.log("\n=== Done ===");
  console.log("Now run GET /api/inventory/reconcile to confirm every product's ledger matches its stock.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// ---------------------------------------------------------------------------
// To fully reset and re-run from scratch on the dev branch:
//   TRUNCATE products, customers, suppliers, inventory_transactions, categories,
//            warehouses RESTART IDENTITY CASCADE;
// (categories/warehouses are recreated by this script; wiping them lets the
// script's getOrCreateWarehouse/getOrCreateCategoryByName paths run fresh
// rather than silently matching stale rows from a previous partial run.)
// ---------------------------------------------------------------------------
