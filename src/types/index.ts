import { z } from "zod";

// User schemas
export const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(["admin", "user"]).default("user"),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Job schemas
export const JobSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  company: z.string().min(2),
  location: z.string().min(2),
  salary: z.string().optional(),
  type: z.enum(["full-time", "part-time", "contract", "internship", "remote"]),
});

export const JobUpdateSchema = JobSchema.partial();

// Application schemas
export const ApplicationSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().optional(),
  resume: z.string().optional(),
});

export const ApplicationUpdateSchema = z.object({
  status: z.enum(["pending", "reviewed", "accepted", "rejected"]).optional(),
  coverLetter: z.string().optional(),
  resume: z.string().optional(),
});
