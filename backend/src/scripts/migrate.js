
import dotenv from "dotenv";
import { runner } from "node-pg-migrate";

dotenv.config();

const runMigrations = async () => {
  try {
    await runner({
      databaseUrl: process.env.DATABASE_URL,
      dir: "migrations",
      direction: "up",
      migrationsTable: "pgmigrations",
      verbose: true
    });

    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  }
};

runMigrations();
