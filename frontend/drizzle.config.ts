import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  // `src/lib/` đã đổi tên thành `src/server/` nhưng config bị bỏ quên, nên
  // `drizzle-kit generate` báo "No schema files found" và không sinh được
  // migration nào. Migration hiện có nằm ở src/server/db/migrations.
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
