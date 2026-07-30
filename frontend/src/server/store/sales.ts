import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { inventoryTransactions, products, salesInvoiceItems, salesInvoices } from "@/server/db/schema";
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
  note?: string;
  items: { productId: string; quantity: number }[];
}) {
  // Merge duplicate product lines so stock is checked against the combined quantity.
  const quantityByProduct = new Map<string, number>();
  for (const item of input.items) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  return db.transaction(async (tx) => {
    const lineItems: {
      productId: string;
      productName: string;
      unit: string;
      unitPrice: number;
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
        unit: product.unit,
        unitPrice: product.price,
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
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      });

      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: new Date() })
        .where(eq(products.id, item.productId));

      await tx.insert(inventoryTransactions).values({
        productId: item.productId,
        type: "export",
        quantity: item.quantity,
        counterparty: input.customerName,
        note: `Xuất theo hoá đơn bán hàng`,
      });
    }

    return invoice;
  });
}
