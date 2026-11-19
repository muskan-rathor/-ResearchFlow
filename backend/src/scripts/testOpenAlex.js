
import "dotenv/config";
import { searchOpenAlex } from "../services/openAlexService.js";

const runTest = async () => {
  try {
    const result = await searchOpenAlex(
      "CSI reliability wireless channel prediction",
      5
    );

    console.log("Total matching papers:", result.totalResults);
    console.log("\nRetrieved papers:\n");

    console.dir(result.papers, { depth: null });
  } catch (error) {
    console.error("OpenAlex test failed:", error.message);
  }
};

runTest();
