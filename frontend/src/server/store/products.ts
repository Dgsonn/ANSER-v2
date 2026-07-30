import { and, asc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { products } from "@/server/db/schema";

export type Product = typeof products.$inferSelect;

export const PRODUCT_CATEGORIES = [
  "Nguyên vật liệu",
  "Bán thành phẩm",
  "Thành phẩm",
  "Phụ liệu",
] as const;

export const LOW_STOCK_THRESHOLD = 20;

export function productStatus(stock: number, threshold = LOW_STOCK_THRESHOLD) {
  if (stock <= 0) return "Hết hàng" as const;
  if (stock < threshold) return "Sắp hết" as const;
  return "Còn hàng" as const;
}

export async function listProducts(filter?: { search?: string; category?: string; warehouseIds?: string[] }) {
  const conditions = [];
  if (filter?.search) {
    conditions.push(ilike(products.name, `%${filter.search}%`));
  }
  if (filter?.category) {
    conditions.push(eq(products.category, filter.category));
  }
  if (filter?.warehouseIds) {
    conditions.push(inArray(products.warehouseId, filter.warehouseIds));
  }

  return db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(products.code));
}

export async function getProductById(id: string) {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0];
}

async function generateProductCode() {
  const rows = await db.select({ count: sql<number>`count(*)` }).from(products);
  const next = (rows[0]?.count ?? 0) + 1;
  return `SP-${String(next).padStart(3, "0")}`;
}

export async function createProduct(input: {
  name: string;
  category: string;
  unit: string;
  stock: number;
  price: number;
  warehouseId: string;
}) {
  const code = await generateProductCode();
  const rows = await db
    .insert(products)
    .values({
      code,
      name: input.name,
      category: input.category,
      unit: input.unit,
      stock: input.stock,
      price: input.price,
      warehouseId: input.warehouseId,
    })
    .returning();
  return rows[0];
}

export async function updateProduct(
  id: string,
  patch: Partial<{ name: string; category: string; unit: string; stock: number; price: number; warehouseId: string }>,
) {
  const rows = await db
    .update(products)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return rows[0];
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}
