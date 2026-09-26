import { getSession, SessionPayload } from "./session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export class AuthorizationError extends Error {
  constructor(message: string = "Unauthorized operation") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Asserts user is authenticated and returns session.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthorizationError("You must be logged in to perform this action.");
  }
  return session;
}

/**
 * Asserts user has OWNER role.
 */
export async function requireOwner(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "OWNER") {
    throw new AuthorizationError("Owner permission required for this operation.");
  }
  return session;
}

/**
 * Validates whether the given user can authorize a specific discount percentage.
 * If discount > staff_max_discount_percent, requires OWNER role.
 */
export async function canApplyDiscount(
  user: SessionPayload,
  discountPercent: number
): Promise<{ allowed: boolean; requiresOwner: boolean; maxAllowed: number }> {
  const db = await getDb();
  const settingRecord = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, "staff_max_discount_percent"))
    .limit(1);

  const staffMaxLimit = settingRecord.length > 0 ? parseFloat(settingRecord[0].value) : 3.0;

  if (user.role === "OWNER") {
    return { allowed: true, requiresOwner: false, maxAllowed: 100.0 };
  }

  // Staff role
  if (discountPercent <= staffMaxLimit) {
    return { allowed: true, requiresOwner: false, maxAllowed: staffMaxLimit };
  }

  return { allowed: false, requiresOwner: true, maxAllowed: staffMaxLimit };
}

/**
 * Validates whether the given user can approve an AI restock purchase order.
 */
export function canApproveRestockOrder(user: SessionPayload): boolean {
  return user.role === "OWNER";
}
