
import dotenv from "dotenv";
import { runner } from "node-pg-migrate";

dotenv.config();

const runMigrations = async () => {
  try {
    const databaseUrl =
      process.env.MIGRATION_DATABASE_URL ||
      process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("Migration database URL is missing");
    }

    console.log("Starting database migrations...");

    await runner({
      databaseUrl,
      dir: "migrations",
      direction: "up",
      migrationsTable: "pgmigrations",
      verbose: true,
      ssl: { rejectUnauthorized: false },
    });

    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  }
};

runMigrations();
