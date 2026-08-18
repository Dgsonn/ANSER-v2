import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { categories } from "@/server/db/schema";

/**
 * Chưa có CRUD/UI riêng cho danh mục — form vẫn chọn tên từ danh sách cố định
 * `PRODUCT_CATEGORIES` (xem store/products.ts). Hàm này giữ nguyên trải nghiệm
 * đó trong khi DB đã chuẩn hoá `products.category` thành `products.category_id`
 * (bảng `categories`, M1): tự tạo dòng danh mục nếu tên chưa tồn tại, trả về id.
 */
export async function getOrCreateCategoryId(name: string): Promise<string> {
  const existing = await db.select().from(categories).where(eq(categories.name, name)).limit(1);
  if (existing[0]) return existing[0].id;

  const inserted = await db
    .insert(categories)
    .values({ name })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return inserted[0].id;

  // Đụng unique constraint do race — dòng đã được tạo giữa lúc select và insert ở trên.
  const [row] = await db.select().from(categories).where(eq(categories.name, name)).limit(1);
  return row.id;
}
