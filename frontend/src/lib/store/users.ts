import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  createdAt: Date;
};

// Temporary in-memory store. TODO: replace with Neon (Postgres) once the DB is provisioned.
const usersByEmail = new Map<string, User>();

export function findUserByEmail(email: string): User | undefined {
  return usersByEmail.get(email.toLowerCase());
}

export function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  passwordHash: string;
}): User {
  const user: User = {
    id: randomUUID(),
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email.toLowerCase(),
    phone: input.phone,
    passwordHash: input.passwordHash,
    createdAt: new Date(),
  };
  usersByEmail.set(user.email, user);
  return user;
}

export function toPublicUser(user: User) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

// Fixed demo login shown as a quick-fill button on the sign-in page.
export const DEMO_ACCOUNT = {
  firstName: "Demo",
  lastName: "User",
  email: "demo@anser.dev",
  password: "demo1234",
};

export function seedDemoUser() {
  if (findUserByEmail(DEMO_ACCOUNT.email)) return;
  createUser({
    firstName: DEMO_ACCOUNT.firstName,
    lastName: DEMO_ACCOUNT.lastName,
    email: DEMO_ACCOUNT.email,
    passwordHash: bcrypt.hashSync(DEMO_ACCOUNT.password, 10),
  });
}

seedDemoUser();
