
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),

  // Enable SSL for Supabase, keep it disabled for local Docker.
  ...(process.env.DB_SSL === "true"
    ? { ssl: { rejectUnauthorized: false } }
    : {}),

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("connect", () => {
  console.log("PostgreSQL connection established");
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});
