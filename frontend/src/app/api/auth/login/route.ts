import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authCookieOptions, COOKIE_NAME, signToken } from "@/server/auth";
import { findUserByEmail, toPublicUser } from "@/server/store/users";

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json({ message: "Thiếu email hoặc mật khẩu." }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ message: "Email hoặc mật khẩu không đúng." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signToken(user.id), authCookieOptions);

  return NextResponse.json({ user: toPublicUser(user) });
}
