import { NextResponse } from "next/server";
import { getRule, deleteRule, updateRule } from "@/server/store/automation";
import { PRODUCT_CATEGORIES } from "@/server/store/products";
import { listWarehouses } from "@/server/store/warehouses";
import { activateN8nWorkflow, deactivateN8nWorkflow } from "@/server/n8nApi";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.categoryFilter && !PRODUCT_CATEGORIES.includes(body.categoryFilter)) {
    return NextResponse.json({ message: "Danh mục không hợp lệ." }, { status: 400 });
  }
  if (body.warehouseId) {
    const validWarehouses = await listWarehouses();
    if (!validWarehouses.some((w) => w.id === body.warehouseId)) {
      return NextResponse.json({ message: "Kho không hợp lệ." }, { status: 400 });
    }
  }

  const existing = await getRule(id);
  if (!existing) {
    return NextResponse.json({ message: "Không tìm thấy quy tắc." }, { status: 404 });
  }

  // Rule đang liên kết với 1 workflow n8n thật (n8nWorkflowId đã được dán vào) — bật/tắt ở đây
  // phải gọi n8n API để bật/tắt workflow THẬT, không chỉ đổi cờ trong DB của app. Nếu gọi n8n
  // lỗi, dừng lại luôn — không cập nhật DB — để tránh 2 nơi lệch trạng thái nhau.
  const linkedWorkflowId = body.n8nWorkflowId !== undefined ? body.n8nWorkflowId || null : existing.n8nWorkflowId;
  if (body.enabled !== undefined && linkedWorkflowId) {
    try {
      if (body.enabled) await activateN8nWorkflow(linkedWorkflowId);
      else await deactivateN8nWorkflow(linkedWorkflowId);
    } catch (error) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : "Không gọi được n8n." },
        { status: 502 },
      );
    }
  }

  const patch: Partial<{
    name: string;
    thresholdQty: number;
    categoryFilter: string | null;
    warehouseId: string | null;
    enabled: boolean;
    n8nWorkflowId: string | null;
  }> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.thresholdQty !== undefined) patch.thresholdQty = Number(body.thresholdQty);
  if (body.categoryFilter !== undefined) patch.categoryFilter = body.categoryFilter || null;
  if (body.warehouseId !== undefined) patch.warehouseId = body.warehouseId || null;
  if (body.enabled !== undefined) patch.enabled = Boolean(body.enabled);
  if (body.n8nWorkflowId !== undefined) patch.n8nWorkflowId = body.n8nWorkflowId || null;

  const rule = await updateRule(id, patch);
  if (!rule) {
    return NextResponse.json({ message: "Không tìm thấy quy tắc." }, { status: 404 });
  }
  return NextResponse.json({ rule });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteRule(id);
  return new NextResponse(null, { status: 204 });
}
