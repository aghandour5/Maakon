import { defineConfig } from "drizzle-kit";
import { getAdminDatabaseConnectionString } from "./src/connection-config";

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getAdminDatabaseConnectionString(process.env.DATABASE_ADMIN_URL),
  },
});
