import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import env from "../env";
import applicationsRoute from "./routes/applications";
import jobsRoute from "./routes/jobs";
import usersRoute from "./routes/users";

const app = new Hono();

// Middleware
app.use(
  cors({
    origin: (origin) => {
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
        return origin || "*";
      }
      return null;
    },
    credentials: true,
  })
);
app.use(logger());

// Routes
app.route("/api/users", usersRoute);
app.route("/api/jobs", jobsRoute);
app.route("/api/applications", applicationsRoute);

// Root route
app.get("/", (c) => {
  return c.json({ message: "JobApp API is running" });
});

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Start the server
console.log(`Starting server on ${env.HOST}:${env.PORT}...`);
export default {
  port: env.PORT,
  hostname: env.HOST,
  fetch: app.fetch,
};
