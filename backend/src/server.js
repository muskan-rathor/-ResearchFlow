
import app from "./app.js";
import { pool } from "./config/database.js";

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from environment variables");
}

const startServer = async () => {
  try {
    await pool.query("SELECT 1");

    const server = app.listen(PORT, () => {
      console.log(`ResearchFlow server running on port ${PORT}`);
      console.log("Server listening:", server.listening);
    });

    server.on("close", () => {
      console.log("HTTP SERVER CLOSED!");
    });

    server.on("error", (error) => {
      console.error("HTTP SERVER ERROR:", error);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
