import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to frontend/.env.local.");
}

// Pool-based (WebSocket) driver — needed for real db.transaction() support,
// unlike the lighter neon-http driver which can only run single statements.
export const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema });
