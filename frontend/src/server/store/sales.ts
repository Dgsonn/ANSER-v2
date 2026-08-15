import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { employees, inventoryTransactions, products, salesInvoiceItems, salesInvoices } from "@/server/db/schema";
import { InsufficientStockError } from "@/server/store/inventory";

export type SalesInvoice = typeof salesInvoices.$inferSelect;
export type SalesInvoiceItem = typeof salesInvoiceItems.$inferSelect;

export class CrossWarehouseError extends Error {}

export async function listInvoices(filter?: { limit?: number; warehouseIds?: string[] }) {
  const limit = filter?.limit ?? 50;

  if (filter?.warehouseIds) {
    const scopedInvoiceIds = db
      .selectDistinct({ id: salesInvoiceItems.invoiceId })
      .from(salesInvoiceItems)
      .innerJoin(products, eq(salesInvoiceItems.productId, products.id))
      .where(inArray(products.warehouseId, filter.warehouseIds));

    return db
      .select()
      .from(salesInvoices)
      .where(inArray(salesInvoices.id, scopedInvoiceIds))
      .orderBy(desc(salesInvoices.createdAt))
      .limit(limit);
  }

  return db.select().from(salesInvoices).orderBy(desc(salesInvoices.createdAt)).limit(limit);
}

export async function getInvoiceById(id: string) {
  const [invoice] = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id)).limit(1);
  if (!invoice) return undefined;
  const items = await db.select().from(salesInvoiceItems).where(eq(salesInvoiceItems.invoiceId, id));
  return { invoice, items };
}

export async function createInvoice(input: {
  customerId?: string;
  customerName: string;
  employeeId?: string;
  note?: string;
  items: { productId: string; quantity: number }[];
}) {
  // Merge duplicate product lines so stock is checked against the combined quantity.
  const quantityByProduct = new Map<string, number>();
  for (const item of input.items) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  // .transaction: A function to tell Drizzle to execute everthing inside as one database transaction
  // If an error were to happen inside the function, the transaction is rolled back, ensuring no partially-created invoice
  return db.transaction(async (tx) => {
    const lineItems: {
      productId: string;
      productName: string;
      employeeId?: string;
      unit: string;
      unitPrice: number;
      unitCost: number | null;
      quantity: number;
      lineTotal: number;
      warehouseId: string;
    }[] = [];

    for (const [productId, quantity] of quantityByProduct) {
      const [product] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
      if (!product) {
        throw new Error("Không tìm thấy sản phẩm.");
      }
      if (product.stock < quantity) {
        throw new InsufficientStockError(
          `Tồn kho không đủ cho ${product.name}: còn ${product.stock}, yêu cầu ${quantity}.`,
        );
      }
      lineItems.push({
        productId,
        productName: product.name,
        employeeId: input.employeeId,
        unit: product.unit,
        unitPrice: product.price,
        // CHỤP LẠI giá vốn tại thời điểm bán. Giá vốn trôi theo mỗi lần nhập
        // hàng, nên đọc `products.cost` lúc làm báo cáo là lấy giá HÔM NAY
        // gán cho đơn bán sáu tháng trước — lãi gộp sai mà không ai thấy.
        // `null` giữ nguyên là chưa biết, không quy về 0.
        unitCost: product.cost ?? null,
        quantity,
        lineTotal: product.price * quantity,
        warehouseId: product.warehouseId,
      });
    }

    const distinctWarehouses = new Set(lineItems.map((item) => item.warehouseId));
    if (distinctWarehouses.size > 1) {
      throw new CrossWarehouseError("Một hoá đơn chỉ được bán sản phẩm trong cùng 1 kho.");
    }

    const total = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const [invoice] = await tx
      .insert(salesInvoices)
      .values({ customerId: input.customerId, customerName: input.customerName, note: input.note, total })
      .returning();

    for (const item of lineItems) {
      await tx.insert(salesInvoiceItems).values({
        invoiceId: invoice.id,
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      });

      // Changing logic from `stock - quantity` to `stock + quantity` with negative values for quantity
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${item.quantity}`, updatedAt: new Date() })
        .where(eq(products.id, item.productId));

      await tx.insert(inventoryTransactions).values({
        productId: item.productId,
        employeeId: item.employeeId,
        type: "export",
        quantity: -item.quantity,
        // B1: Export is negative
        // This is kept consistent with the {products.stock} + {item.quantity}, rather than reintroducing a minus
        unitCost: item.unitCost,
        // `unitCost` LUÔN là giá vốn, kể cả ở dòng xuất — không bao giờ là giá
        // bán. Ghi giá bán vào đây là biến sổ kho thành sổ doanh thu.
        sourceType: "sale", // Check constrain 'inv_tx_source_type_hop_le'
        sourceId: invoice.id, // Link stock transaction to salesInvoices.id
        counterparty: input.customerName,
        note: `Xuất theo hoá đơn bán hàng`,
      });
    }

    return invoice;
  });
}
