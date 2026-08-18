import { desc, eq, getTableColumns, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { automationRules, categories } from "@/server/db/schema";
import { getOrCreateCategoryId } from "@/server/store/categories";
import { listProducts, LOW_STOCK_THRESHOLD, type Product } from "@/server/store/products";

// `categoryFilter` (text) đã đổi thành `categoryId` -> categories.id (M1), cùng lý do với
// products.category (xem store/products.ts) — join để giữ nguyên hình dạng cho phần còn lại của app.
const ruleWithCategory = {
  ...getTableColumns(automationRules),
  categoryFilter: sql<string | null>`${categories.name}`.as("categoryFilter"),
};

export type AutomationRule = Awaited<ReturnType<typeof listRules>>[number];

export async function listRules(warehouseIds?: string[]) {
  return db
    .select(ruleWithCategory)
    .from(automationRules)
    .leftJoin(categories, eq(automationRules.categoryId, categories.id))
    .where(
      warehouseIds
        ? or(isNull(automationRules.warehouseId), inArray(automationRules.warehouseId, warehouseIds))
        : undefined,
    )
    .orderBy(desc(automationRules.createdAt));
}

export async function createRule(input: {
  name: string;
  type?: string;
  thresholdQty?: number;
  categoryFilter?: string;
  warehouseId?: string;
  enabled?: boolean;
  n8nWorkflowId?: string;
}) {
  const type = input.type ?? "low_stock_alert";
  const categoryId = input.categoryFilter ? await getOrCreateCategoryId(input.categoryFilter) : undefined;
  const rows = await db
    .insert(automationRules)
    .values({
      name: input.name,
      type,
      // Ngưỡng/danh mục chỉ có ý nghĩa với rule tồn kho — các loại khác (báo cáo doanh số,
      // chào khách hàng mới) chỉ là dòng đánh dấu "đã triển khai qua n8n", không dùng threshold.
      thresholdQty: type === "low_stock_alert" ? (input.thresholdQty ?? LOW_STOCK_THRESHOLD) : null,
      categoryId,
      warehouseId: input.warehouseId,
      enabled: input.enabled ?? true,
      n8nWorkflowId: input.n8nWorkflowId,
    })
    .returning();
  return { ...rows[0], categoryFilter: input.categoryFilter ?? null };
}

export async function updateRule(
  id: string,
  patch: Partial<{
    name: string;
    thresholdQty: number;
    categoryFilter: string | null;
    warehouseId: string | null;
    enabled: boolean;
    n8nWorkflowId: string | null;
  }>,
) {
  const { categoryFilter, ...rest } = patch;
  const categoryId =
    categoryFilter !== undefined
      ? categoryFilter === null
        ? null
        : await getOrCreateCategoryId(categoryFilter)
      : undefined;
  await db
    .update(automationRules)
    .set({ ...rest, ...(categoryId !== undefined ? { categoryId } : {}) })
    .where(eq(automationRules.id, id))
    .returning();
  return getRule(id);
}

export async function getRule(id: string) {
  const rows = await db
    .select(ruleWithCategory)
    .from(automationRules)
    .leftJoin(categories, eq(automationRules.categoryId, categories.id))
    .where(eq(automationRules.id, id));
  return rows[0];
}

export async function deleteRule(id: string) {
  await db.delete(automationRules).where(eq(automationRules.id, id));
}

export type AutomationAlert = {
  ruleId: string;
  ruleName: string;
  productId: string;
  productCode: string;
  productName: string;
  stock: number;
  thresholdQty: number;
};

// Tách riêng phần tính toán thuần (không gọi DB) để nơi nào đã có sẵn products/rules trong tay
// (vd getReportSummary()) tái dùng được luôn, khỏi phải fetch lại — evaluateAlerts() bên dưới
// vẫn là bản đầy đủ (tự fetch) cho những chỗ chưa có sẵn dữ liệu.
export function computeAlerts(products: Product[], rules: AutomationRule[]): AutomationAlert[] {
  const activeRules = rules.filter((rule) => rule.enabled && rule.type === "low_stock_alert");
  const alerts: AutomationAlert[] = [];

  for (const rule of activeRules) {
    const threshold = rule.thresholdQty ?? LOW_STOCK_THRESHOLD;
    const matching = products.filter(
      (product) =>
        product.stock < threshold &&
        (!rule.categoryFilter || product.category === rule.categoryFilter) &&
        (!rule.warehouseId || product.warehouseId === rule.warehouseId),
    );
    for (const product of matching) {
      alerts.push({
        ruleId: rule.id,
        ruleName: rule.name,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        stock: product.stock,
        thresholdQty: threshold,
      });
    }
  }

  return alerts;
}

export async function evaluateAlerts(warehouseIds?: string[]): Promise<AutomationAlert[]> {
  const rules = await listRules(warehouseIds);
  if (!rules.some((rule) => rule.enabled && rule.type === "low_stock_alert")) return [];
  const products = await listProducts({ warehouseIds });
  return computeAlerts(products, rules);
}
