import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/session";
import { deleteEmployee, updateEmployee } from "@/server/store/employees";
import { listWarehouses } from "@/server/store/warehouses";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.name !== undefined && !String(body.name).trim()) {
    return NextResponse.json({ message: "Tên nhân viên không được để trống." }, { status: 400 });
  }
  if (body.warehouseId) {
    const validWarehouses = await listWarehouses();
    if (!validWarehouses.some((w) => w.id === body.warehouseId)) {
      return NextResponse.json({ message: "Kho không hợp lệ." }, { status: 400 });
    }
  }

  const patch: Partial<{
    name: string;
    position: string | null;
    phone: string | null;
    email: string | null;
    hireDate: Date | null;
    warehouseId: string | null;
    note: string | null;
  }> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.position !== undefined) patch.position = body.position || null;
  if (body.phone !== undefined) patch.phone = body.phone || null;
  if (body.email !== undefined) patch.email = body.email || null;
  if (body.hireDate !== undefined) patch.hireDate = body.hireDate ? new Date(body.hireDate) : null;
  if (body.warehouseId !== undefined) patch.warehouseId = body.warehouseId || null;
  if (body.note !== undefined) patch.note = body.note || null;

  const employee = await updateEmployee(id, patch);
  if (!employee) {
    return NextResponse.json({ message: "Không tìm thấy nhân viên." }, { status: 404 });
  }
  return NextResponse.json({ employee });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }
  const { id } = await params;
  await deleteEmployee(id);
  return new NextResponse(null, { status: 204 });
}
