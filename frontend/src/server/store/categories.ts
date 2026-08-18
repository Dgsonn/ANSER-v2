import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { categories } from "@/server/db/schema";

export type Category = typeof categories.$inferSelect;

export const DEFAULT_CATEGORIES = [
  "Nguyên vật liệu",
  "Bán thành phẩm",
  "Thành phẩm",
  "Phụ liệu",
] as const;

export async function listCategories(): Promise<Category[]> {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0];
}

export async function getOrCreateCategoryByName(name: string): Promise<Category> {
  const trimmed = name.trim();
  const existing = await db.select().from(categories).where(eq(categories.name, trimmed)).limit(1);
  if (existing[0]) return existing[0];

  const inserted = await db.insert(categories).values({ name: trimmed }).returning();
  return inserted[0];
}

export async function seedCategories(): Promise<Category[]> {
  const existing = await listCategories();
  if (existing.length > 0) return existing;

  const inserted = await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((name) => ({ name })))
    .returning();
  return inserted;
}
