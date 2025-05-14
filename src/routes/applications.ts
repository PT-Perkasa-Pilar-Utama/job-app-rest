import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { applications, jobs } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { ApplicationSchema, ApplicationUpdateSchema } from "../types";
import type { Variables } from "../types/hono-var";

const applicationsRoute = new Hono<{ Variables: Variables }>();

// Create application (authenticated user)
applicationsRoute.post(
  "/",
  authenticate,
  zValidator("json", ApplicationSchema),
  async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user") as { userId: string; role: string };

    try {
      // Check if job exists
      const job = await db.query.jobs.findFirst({
        where: eq(jobs.id, data.jobId),
      });

      if (!job) {
        return c.json({ error: "Job not found" }, 404);
      }

      // Check if user already applied for this job
      const existingApplication = await db.query.applications.findFirst({
        where: and(
          eq(applications.userId, user.userId),
          eq(applications.jobId, data.jobId)
        ),
      });

      if (existingApplication) {
        return c.json({ error: "You have already applied for this job" }, 400);
      }

      const newApplication = await db
        .insert(applications)
        .values({
          ...data,
          userId: user.userId,
        })
        .returning();

      return c.json(newApplication[0], 201);
    } catch (error) {
      return c.json({ error: "Failed to create application" }, 500);
    }
  }
);

// Get all applications (admin sees all, user sees only their own)
applicationsRoute.get("/", authenticate, async (c) => {
  const user = c.get("user") as { userId: string; role: string };

  try {
    if (user.role === "admin") {
      // Admin sees all applications
      const allApplications = await db.query.applications.findMany({
        with: {
          user: true,
          job: true,
        },
        orderBy: (applications, { desc }) => [desc(applications.createdAt)],
      });

      // Remove passwords from users
      const safeApplications = allApplications.map((app) => {
        const { password, ...userWithoutPassword } = app.user;

        return {
          ...app,
          user: userWithoutPassword,
        };
      });

      return c.json(safeApplications);
    } else {
      // User sees only their own applications
      const userApplications = await db.query.applications.findMany({
        where: eq(applications.userId, user.userId),
        with: {
          job: true,
        },
        orderBy: (applications, { desc }) => [desc(applications.createdAt)],
      });

      return c.json(userApplications);
    }
  } catch (error) {
    return c.json({ error: "Failed to fetch applications" }, 500);
  }
});

// Get application by ID (admin or the applicant)
applicationsRoute.get("/:id", authenticate, async (c) => {
  const applicationId = c.req.param("id");
  const user = c.get("user") as { userId: string; role: string };

  try {
    const application = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
      with: {
        user: true,
        job: true,
      },
    });

    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }

    // Check if admin or the applicant
    if (user.role !== "admin" && application.userId !== user.userId) {
      return c.json(
        { error: "Forbidden: You can only access your own applications" },
        403
      );
    }

    // Remove password from user
    const { password, ...userWithoutPassword } = application.user;

    return c.json({
      ...application,
      user: userWithoutPassword,
    });
  } catch (error) {
    return c.json({ error: "Failed to fetch application" }, 500);
  }
});

// Update application (admin can update status, user can update their own application)
applicationsRoute.patch(
  "/:id",
  authenticate,
  zValidator("json", ApplicationUpdateSchema),
  async (c) => {
    const applicationId = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user") as { userId: string; role: string };

    try {
      // Check if application exists and belongs to user
      const application = await db.query.applications.findFirst({
        where: eq(applications.id, applicationId),
      });

      if (!application) {
        return c.json({ error: "Application not found" }, 404);
      }

      // Check permissions
      if (user.role !== "admin" && application.userId !== user.userId) {
        return c.json(
          { error: "Forbidden: You can only update your own applications" },
          403
        );
      }

      // Regular users can update cover letter and resume, but not status
      if (user.role !== "admin" && data.status) {
        return c.json(
          { error: "Forbidden: Only admins can update application status" },
          403
        );
      }

      const updatedApplication = await db
        .update(applications)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(applications.id, applicationId))
        .returning();

      return c.json(updatedApplication[0]);
    } catch (error) {
      return c.json({ error: "Failed to update application" }, 500);
    }
  }
);

// Delete application (admin or the applicant)
applicationsRoute.delete("/:id", authenticate, async (c) => {
  const applicationId = c.req.param("id");
  const user = c.get("user") as { userId: string; role: string };

  try {
    // Check if application exists and belongs to user
    const application = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
    });

    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }

    // Check permissions
    if (user.role !== "admin" && application.userId !== user.userId) {
      return c.json(
        { error: "Forbidden: You can only delete your own applications" },
        403
      );
    }

    const deletedApplication = await db
      .delete(applications)
      .where(eq(applications.id, applicationId))
      .returning();

    return c.json({ message: "Application deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete application" }, 500);
  }
});

export default applicationsRoute;
