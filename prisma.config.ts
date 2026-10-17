import { defineConfig } from "prisma/config";

// DATABASE_URL n'est lu que par les migrations : `prisma generate` (lancé à chaque
// installation, y compris en CI) n'en a pas besoin.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
