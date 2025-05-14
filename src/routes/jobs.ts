import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { jobs } from "../db/schema";
import { authenticate, requireAdmin } from "../middleware/auth";
import { JobSchema, JobUpdateSchema } from "../types";

const jobsRoute = new Hono();

// Create job (admin only)
jobsRoute.post(
  "/",
  authenticate,
  requireAdmin,
  zValidator("json", JobSchema),
  async (c) => {
    const data = c.req.valid("json");

    try {
      const newJob = await db.insert(jobs).values(data).returning();

      return c.json(newJob[0], 201);
    } catch (error) {
      return c.json({ error: "Failed to create job" }, 500);
    }
  }
);

// Get all jobs (public)
jobsRoute.get("/", async (c) => {
  try {
    const allJobs = await db.query.jobs.findMany({
      orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
    });

    return c.json(allJobs);
  } catch (error) {
    return c.json({ error: "Failed to fetch jobs" }, 500);
  }
});

// Get job by ID (public)
jobsRoute.get("/:id", async (c) => {
  const jobId = c.req.param("id");

  try {
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
    });

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    return c.json(job);
  } catch (error) {
    return c.json({ error: "Failed to fetch job" }, 500);
  }
});

// Update job (admin only)
jobsRoute.patch(
  "/:id",
  authenticate,
  requireAdmin,
  zValidator("json", JobUpdateSchema),
  async (c) => {
    const jobId = c.req.param("id");
    const data = c.req.valid("json");

    try {
      const updatedJob = await db
        .update(jobs)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId))
        .returning();

      if (!updatedJob.length) {
        return c.json({ error: "Job not found" }, 404);
      }

      return c.json(updatedJob[0]);
    } catch (error) {
      return c.json({ error: "Failed to update job" }, 500);
    }
  }
);

// Delete job (admin only)
jobsRoute.delete("/:id", authenticate, requireAdmin, async (c) => {
  const jobId = c.req.param("id");

  try {
    const deletedJob = await db
      .delete(jobs)
      .where(eq(jobs.id, jobId))
      .returning();

    if (!deletedJob.length) {
      return c.json({ error: "Job not found" }, 404);
    }

    return c.json({ message: "Job deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete job" }, 500);
  }
});

export default jobsRoute;
