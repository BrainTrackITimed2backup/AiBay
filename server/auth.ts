import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerUser(username: string, email: string, password: string) {
  if (!username || !email || !password) throw new Error("All fields required");
  if (username.length < 3) throw new Error("Username must be at least 3 characters");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email address");

  const [existingEmail] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (existingEmail) throw new Error("Email already registered");

  const [existingUsername] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existingUsername) throw new Error("Username already taken");

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(users).values({
    username,
    email: email.toLowerCase(),
    passwordHash,
    role: "user",
    plan: "free",
  }).returning();

  return sanitizeUser(user);
}

export async function loginUser(email: string, password: string) {
  if (!email || !password) throw new Error("Email and password required");

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user) throw new Error("Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  return sanitizeUser(user);
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return null;
  return sanitizeUser(user);
}

export async function getAllUsers() {
  const all = await db.select().from(users).orderBy(users.createdAt);
  return all.map(sanitizeUser);
}

export function sanitizeUser(user: typeof users.$inferSelect) {
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}
