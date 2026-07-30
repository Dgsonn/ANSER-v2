import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/server/session";
import { ASSIGNABLE_ROLES, createUser, findUserByEmail, listUsers, toPublicUser } from "@/server/store/users";
import { getEmployeeById } from "@/server/store/employees";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }
  const users = await listUsers();
  return NextResponse.json({ users: users.map(toPublicUser) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
  }

  const { firstName, lastName, email, phone, password, role, employeeId } = await request.json().catch(() => ({}));

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ message: "Thiếu thông tin bắt buộc." }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ message: "Mật khẩu phải có ít nhất 6 ký tự." }, { status: 400 });
  }
  if (role !== undefined && !ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ message: "Vai trò không hợp lệ." }, { status: 400 });
  }
  if (await findUserByEmail(email)) {
    return NextResponse.json({ message: "Email đã được sử dụng." }, { status: 409 });
  }
  if (employeeId && !(await getEmployeeById(employeeId))) {
    return NextResponse.json({ message: "Nhân viên không hợp lệ." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({ firstName, lastName, email, phone, passwordHash, role, employeeId });
  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}
