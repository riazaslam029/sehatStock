"use server";

import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession, destroySession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  try {
    const db = await getDb();
    const userQuery = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        passwordHash: schema.users.passwordHash,
        status: schema.users.status,
        roleName: schema.roles.name,
      })
      .from(schema.users)
      .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(eq(schema.users.email, email))
      .limit(1);

    if (userQuery.length === 0) {
      return { success: false, error: "Invalid email or password." };
    }

    const user = userQuery[0];
    if (user.status !== "ACTIVE") {
      return { success: false, error: "Account is inactive. Contact pharmacy owner." };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid email or password." };
    }

    await createSession({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.roleName as "OWNER" | "STAFF",
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication error.";
    return { success: false, error: message };
  }
}

export async function quickDemoLoginAction(role: "OWNER" | "STAFF"): Promise<AuthResult> {
  try {
    const db = await getDb();
    const email = role === "OWNER" ? "owner@sehatstock.pk" : "staff@sehatstock.pk";

    const userQuery = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        roleName: schema.roles.name,
      })
      .from(schema.users)
      .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(eq(schema.users.email, email))
      .limit(1);

    if (userQuery.length === 0) {
      return { success: false, error: "Demo user not found. Run db:seed." };
    }

    const user = userQuery[0];
    await createSession({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.roleName as "OWNER" | "STAFF",
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to switch role.";
    return { success: false, error: message };
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
