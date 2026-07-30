import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/session";
import { createEmployee, listEmployees } from "@/server/store/employees";
import { listWarehouses } from "@/server/store/warehouses";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }
  const employees = await listEmployees();
  return NextResponse.json({ employees });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (!body.name || !String(body.name).trim()) {
    return NextResponse.json({ message: "Thiếu tên nhân viên." }, { status: 400 });
  }
  if (body.warehouseId) {
    const validWarehouses = await listWarehouses();
    if (!validWarehouses.some((w) => w.id === body.warehouseId)) {
      return NextResponse.json({ message: "Kho không hợp lệ." }, { status: 400 });
    }
  }

  const employee = await createEmployee({
    name: body.name,
    position: body.position || undefined,
    phone: body.phone || undefined,
    email: body.email || undefined,
    hireDate: body.hireDate ? new Date(body.hireDate) : undefined,
    warehouseId: body.warehouseId || undefined,
    note: body.note || undefined,
  });
  return NextResponse.json({ employee }, { status: 201 });
}
