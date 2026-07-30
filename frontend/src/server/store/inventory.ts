import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { inventoryTransactions, products, warehouses } from "@/server/db/schema";
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

export async function createTransaction(input: {
  productId: string;
  type: TransactionType;
  quantity: number;
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

  const delta = input.type === "import" ? input.quantity : -input.quantity;

  const [transaction] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(inventoryTransactions)
      .values({
        productId: input.productId,
        type: input.type,
        quantity: input.quantity,
        counterparty: input.counterparty,
        note: input.note,
      })
      .returning();

    await tx
      .update(products)
      .set({ stock: sql`${products.stock} + ${delta}`, updatedAt: new Date() })
      .where(eq(products.id, input.productId));

    return [created];
  });

  return transaction;
}
