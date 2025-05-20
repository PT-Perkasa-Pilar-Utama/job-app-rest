import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { users } from "../db/schema";
import { authenticate, requireAdmin } from "../middleware/auth";
import { LoginSchema, UserSchema, UserUpdateSchema } from "../types";
import type { Variables } from "../types/hono-var";
import { comparePassword, generateToken, hashPassword } from "../utils";

const usersRoute = new Hono<{ Variables: Variables }>();

// Register new user (admin only)
usersRoute.post("/register", zValidator("json", UserSchema), async (c) => {
  const data = c.req.valid("json");

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      return c.json({ error: "User with this email already exists" }, 400);
    }

    const hashedPassword = await hashPassword(data.password);

    const newUser = await db
      .insert(users)
      .values({
        ...data,
        role: "user",
        password: hashedPassword,
      })
      .returning();

    // Fix the type checking issue - make sure newUser[0] exists
    if (newUser[0]) {
      // Safely destructure the password field
      const { password, ...userWithoutPassword } = newUser[0];
      return c.json(userWithoutPassword, 201);
    }

    return c.json({ error: "Failed to create user" }, 500);
  } catch (error) {
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// Login
usersRoute.post("/login", zValidator("json", LoginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const token = generateToken(user.id, user.role);

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return c.json({ error: "Login failed" }, 500);
  }
});

// Get all users (admin only)
usersRoute.get("/", authenticate, requireAdmin, async (c) => {
  try {
    const allUsers = await db.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    // Remove passwords from response
    const usersWithoutPasswords = allUsers.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return c.json(usersWithoutPasswords);
  } catch (error) {
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Get user by ID (admin or self)
usersRoute.get("/:id", authenticate, async (c) => {
  const userId = c.req.param("id");
  const requestingUser = c.get("user") as { userId: string; role: string };

  // Check if admin or self
  if (requestingUser.role !== "admin" && requestingUser.userId !== userId) {
    return c.json(
      { error: "Forbidden: You can only access your own information" },
      403
    );
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Safely remove password from response
    const { password, ...userWithoutPassword } = user;
    return c.json(userWithoutPassword);
  } catch (error) {
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// Update user (self only for regular users, admin can update anyone)
usersRoute.patch(
  "/:id",
  authenticate,
  zValidator("json", UserUpdateSchema),
  async (c) => {
    const userId = c.req.param("id");
    const requestingUser = c.get("user") as { userId: string; role: string };
    const data = c.req.valid("json");

    // Check if admin or self
    if (requestingUser.role !== "admin" && requestingUser.userId !== userId) {
      return c.json(
        { error: "Forbidden: You can only update your own information" },
        403
      );
    }

    try {
      // Hash password if included in update
      if (data.password) {
        data.password = await hashPassword(data.password);
      }

      const updatedUser = await db
        .update(users)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser.length) {
        return c.json({ error: "User not found" }, 404);
      }

      // Safely remove password from response
      const userWithoutPassword = { ...updatedUser[0] };
      delete userWithoutPassword.password;

      return c.json(userWithoutPassword);
    } catch (error) {
      return c.json({ error: "Failed to update user" }, 500);
    }
  }
);

// Delete user (admin only)
usersRoute.delete("/:id", authenticate, requireAdmin, async (c) => {
  const userId = c.req.param("id");

  try {
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (!deletedUser.length) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

export default usersRoute;
