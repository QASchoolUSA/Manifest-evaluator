import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url:
      process.env.TURSO_DATABASE_URL ||
      process.env.LIBSQL_URL ||
      "file:./data/manifest-evaluator.db",
  },
});
