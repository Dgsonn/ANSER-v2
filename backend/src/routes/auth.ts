import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail, toPublicUser } from "../store/users.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const COOKIE_NAME = "anser_token";
const isProduction = process.env.NODE_ENV === "production";

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}

function setAuthCookie(res: import("express").Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body ?? {};

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ message: "Email đã được sử dụng." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ firstName, lastName, email, phone, passwordHash });

  setAuthCookie(res, signToken(user.id));
  res.status(201).json({ user: toPublicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: "Thiếu email hoặc mật khẩu." });
  }

  const user = findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
  }

  setAuthCookie(res, signToken(user.id));
  res.json({ user: toPublicUser(user) });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.status(204).send();
});

export default router;
