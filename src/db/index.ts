import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import env from "../../env";
import * as schema from "./schema";

const sqlite = new Database(env.DATABASE_URL);
export const db = drizzle(sqlite, { schema });
