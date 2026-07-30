import { NextResponse } from "next/server";
import { createRule, listRules } from "@/server/store/automation";
import { PRODUCT_CATEGORIES } from "@/server/store/products";
import { listWarehouses } from "@/server/store/warehouses";

const RULE_TYPES = ["low_stock_alert", "sales_report", "customer_welcome"];

export async function GET() {
  const rules = await listRules();
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const { name, type, thresholdQty, categoryFilter, warehouseId, enabled } = await request.json().catch(() => ({}));

  if (!name) {
    return NextResponse.json({ message: "Thiếu tên quy tắc." }, { status: 400 });
  }
  if (type && !RULE_TYPES.includes(type)) {
    return NextResponse.json({ message: "Loại quy tắc không hợp lệ." }, { status: 400 });
  }
  if (categoryFilter && !PRODUCT_CATEGORIES.includes(categoryFilter)) {
    return NextResponse.json({ message: "Danh mục không hợp lệ." }, { status: 400 });
  }
  if (warehouseId) {
    const validWarehouses = await listWarehouses();
    if (!validWarehouses.some((w) => w.id === warehouseId)) {
      return NextResponse.json({ message: "Kho không hợp lệ." }, { status: 400 });
    }
  }
  const thresholdNum = thresholdQty !== undefined ? Number(thresholdQty) : undefined;
  if (thresholdNum !== undefined && (!Number.isFinite(thresholdNum) || thresholdNum < 0)) {
    return NextResponse.json({ message: "Ngưỡng tồn kho không hợp lệ." }, { status: 400 });
  }

  const rule = await createRule({
    name,
    type,
    thresholdQty: thresholdNum,
    categoryFilter: categoryFilter || undefined,
    warehouseId: warehouseId || undefined,
    enabled: enabled ?? true,
  });
  return NextResponse.json({ rule }, { status: 201 });
}
