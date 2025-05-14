import { type Context } from "hono";
import { verify } from "jsonwebtoken";
import env from "../../env";

export async function authenticate(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  const token = authHeader.split(" ")[1]!;
  const jwtSecret = env.JWT_SECRET;

  try {
    // Fix the type conversion issue
    const decoded = verify(token, jwtSecret);

    // Check if decoded is an object with the required properties
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "userId" in decoded &&
      "role" in decoded
    ) {
      c.set("user", {
        userId: decoded.userId as string,
        role: decoded.role as string,
      });
      await next();
    } else {
      return c.json({ error: "Unauthorized: Invalid token structure" }, 401);
    }
  } catch (error) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
}

export function requireAdmin(c: Context, next: () => Promise<void>) {
  const user = c.get("user") as { userId: string; role: string } | undefined;

  if (!user || user.role !== "admin") {
    return c.json({ error: "Forbidden: Admin access required" }, 403);
  }

  return next();
}
