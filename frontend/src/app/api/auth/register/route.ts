import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authCookieOptions, COOKIE_NAME, signToken } from "@/server/auth";
import { createUser, findUserByEmail, toPublicUser } from "@/server/store/users";

export async function POST(request: Request) {
  const { firstName, lastName, email, phone, password } = await request.json().catch(() => ({}));

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ message: "Thiếu thông tin bắt buộc." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ message: "Mật khẩu phải có ít nhất 6 ký tự." }, { status: 400 });
  }

  if (await findUserByEmail(email)) {
    return NextResponse.json({ message: "Email đã được sử dụng." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({ firstName, lastName, email, phone, passwordHash });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signToken(user.id), authCookieOptions);

  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}
