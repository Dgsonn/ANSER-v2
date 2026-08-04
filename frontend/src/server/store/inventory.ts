import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { inventoryTransactions, products, warehouses } from "@/server/db/schema";
import { weightedAverageCost } from "@/server/store/inventoryCost";
import { getProductById } from "@/server/store/products";

export type TransactionType = "import" | "export";

export class InsufficientStockError extends Error {}

export async function listTransactions(filter?: {
  type?: TransactionType;
  limit?: number;
  warehouseIds?: string[];
}) {
  const conditions = [];
  if (filter?.type) conditions.push(eq(inventoryTransactions.type, filter.type));
  if (filter?.warehouseIds) conditions.push(inArray(products.warehouseId, filter.warehouseIds));

  const rows = await db
    .select({
      id: inventoryTransactions.id,
      productId: inventoryTransactions.productId,
      type: inventoryTransactions.type,
      quantity: inventoryTransactions.quantity,
      unitCost: inventoryTransactions.unitCost,
      counterparty: inventoryTransactions.counterparty,
      note: inventoryTransactions.note,
      createdAt: inventoryTransactions.createdAt,
      productCode: products.code,
      productName: products.name,
      warehouseName: warehouses.name,
    })
    .from(inventoryTransactions)
    .innerJoin(products, eq(inventoryTransactions.productId, products.id))
    .innerJoin(warehouses, eq(products.warehouseId, warehouses.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(inventoryTransactions.createdAt))
    .limit(filter?.limit ?? 100);

  return rows;
}

export type InventoryTransactionWithProduct = Awaited<ReturnType<typeof listTransactions>>[number];

export { weightedAverageCost } from "@/server/store/inventoryCost";

export async function createTransaction(input: {
  productId: string;
  type: TransactionType;
  quantity: number;
  /** Đơn giá của chính lô này (VND). `undefined`/`null` = phiếu không ghi giá. */
  unitCost?: number | null;
  counterparty?: string;
  note?: string;
}) {
  const product = await getProductById(input.productId);
  if (!product) {
    throw new Error("Không tìm thấy sản phẩm.");
  }
  if (input.type === "export" && product.stock < input.quantity) {
    throw new InsufficientStockError(
      `Tồn kho không đủ: còn ${product.stock}, yêu cầu xuất ${input.quantity}.`,
    );
  }
  const unitCost = input.unitCost ?? null;
  if (unitCost !== null && (!Number.isFinite(unitCost) || unitCost < 0)) {
    throw new Error("Đơn giá phải là số không âm.");
  }

  const delta = input.type === "import" ? input.quantity : -input.quantity;

  // Chỉ phiếu NHẬP mới cập nhật giá vốn. Giá trên phiếu xuất là giá BÁN — bình
  // quân giá bán vào giá vốn là biến toàn bộ lãi gộp thành số 0.
  const nextCost =
    input.type === "import"
      ? weightedAverageCost({
          oldStock: product.stock,
          oldCost: product.cost ?? null,
          inQty: input.quantity,
          inCost: unitCost,
        })
      : product.cost ?? null;

  const [transaction] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(inventoryTransactions)
      .values({
        productId: input.productId,
        type: input.type,
        quantity: input.quantity,
        unitCost,
        counterparty: input.counterparty,
        note: input.note,
      })
      .returning();

    await tx
      .update(products)
      .set({
        stock: sql`${products.stock} + ${delta}`,
        cost: nextCost,
        updatedAt: new Date(),
      })
      .where(eq(products.id, input.productId));

    return [created];
  });

  return transaction;
}
