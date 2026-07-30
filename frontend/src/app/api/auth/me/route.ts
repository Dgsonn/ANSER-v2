import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { updateUser, toPublicUser } from "@/server/store/users";
import { getSessionUser } from "@/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }
  return NextResponse.json({ user: toPublicUser(user) });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.currentPassword || body.newPassword) {
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json({ message: "Thiếu mật khẩu hiện tại hoặc mật khẩu mới." }, { status: 400 });
    }
    if (String(body.newPassword).length < 6) {
      return NextResponse.json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." }, { status: 400 });
    }
    if (!(await bcrypt.compare(body.currentPassword, user.passwordHash))) {
      return NextResponse.json({ message: "Mật khẩu hiện tại không đúng." }, { status: 400 });
    }
    await updateUser(user.id, { passwordHash: bcrypt.hashSync(body.newPassword, 10) });
  }

  const profilePatch: Partial<{ firstName: string; lastName: string; phone: string | null }> = {};
  if (body.firstName !== undefined && !String(body.firstName).trim()) {
    return NextResponse.json({ message: "Tên không được để trống." }, { status: 400 });
  }
  if (body.lastName !== undefined && !String(body.lastName).trim()) {
    return NextResponse.json({ message: "Họ không được để trống." }, { status: 400 });
  }
  if (body.firstName !== undefined) profilePatch.firstName = body.firstName;
  if (body.lastName !== undefined) profilePatch.lastName = body.lastName;
  if (body.phone !== undefined) profilePatch.phone = body.phone || null;

  const updated = Object.keys(profilePatch).length > 0 ? await updateUser(user.id, profilePatch) : user;

  return NextResponse.json({ user: toPublicUser(updated!) });
}
