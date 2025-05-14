import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import env from "../../env";
import { hashPassword } from "../utils";
import { db } from "./index";
import { users } from "./schema";

console.log("Running migrations...");

migrate(db, { migrationsFolder: "./migrations" });

console.log("Migrations complete!");

// Create initial admin user
async function createInitialAdmin() {
  try {
    // Check if there's already an admin user
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.role, "admin"),
    });

    if (!existingAdmin) {
      const adminEmail = env.ADMIN_EMAIL;
      const adminPassword = env.ADMIN_PASSWORD;
      const adminName = env.ADMIN_NAME;

      const hashedPassword = await hashPassword(adminPassword);

      await db.insert(users).values({
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: "admin",
      });

      console.log("Created initial admin user:");
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    }
  } catch (error) {
    console.error("Failed to create initial admin:", error);
  }
}

createInitialAdmin();
