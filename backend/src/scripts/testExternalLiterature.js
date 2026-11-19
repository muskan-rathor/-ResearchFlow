
import "dotenv/config";
import { discoverExternalLiterature } from "../services/externalLiteratureService.js";

const WORKSPACE_ID = "f9f2e107-6cdd-4166-acb4-26f6a8eec6b0";

const runTest = async () => {
  try {
    const result = await discoverExternalLiterature(WORKSPACE_ID);

    console.log("\nExternal Literature Discovery Result:\n");
    console.dir(result, { depth: null });
  } catch (error) {
    console.error("Literature discovery failed:", error.message);
  }
};

runTest();
