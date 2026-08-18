import { and, asc, eq, getTableColumns, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { categories, products } from "@/server/db/schema";
import { getOrCreateCategoryId } from "@/server/store/categories";

// Cột `category` (text) đã đổi thành `categoryId` -> categories.id (M1). Chọn thêm tên danh mục
// qua join để phần còn lại của app (report, form, bảng) không phải đổi hình dạng dữ liệu.
const productWithCategory = {
  ...getTableColumns(products),
  category: sql<string | null>`${categories.name}`.as("category"),
};

export type Product = Awaited<ReturnType<typeof listProducts>>[number];

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
    conditions.push(eq(categories.name, filter.category));
  }
  if (filter?.warehouseIds) {
    conditions.push(inArray(products.warehouseId, filter.warehouseIds));
  }

  return db
    .select(productWithCategory)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(products.code));
}

export async function getProductById(id: string) {
  const rows = await db
    .select(productWithCategory)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);
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
  /** Giá vốn đơn vị. Bỏ qua = CHƯA BIẾT (`null`), khác hẳn 0. */
  cost?: number | null;
  warehouseId: string;
}) {
  const [code, categoryId] = await Promise.all([generateProductCode(), getOrCreateCategoryId(input.category)]);
  const rows = await db
    .insert(products)
    .values({
      code,
      name: input.name,
      categoryId,
      unit: input.unit,
      stock: input.stock,
      price: input.price,
      cost: input.cost ?? null,
      warehouseId: input.warehouseId,
    })
    .returning();
  return { ...rows[0], category: input.category };
}

export async function updateProduct(
  id: string,
  patch: Partial<{
    name: string;
    category: string;
    unit: string;
    stock: number;
    price: number;
    cost: number | null;
    warehouseId: string;
  }>,
) {
  const { category, ...rest } = patch;
  const categoryId = category !== undefined ? await getOrCreateCategoryId(category) : undefined;
  const rows = await db
    .update(products)
    .set({ ...rest, ...(categoryId !== undefined ? { categoryId } : {}), updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  if (!rows[0]) return undefined;
  // Đọc lại kèm join để lấy đúng tên danh mục hiện hành (kể cả khi patch này không đổi category).
  return getProductById(id);
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}
