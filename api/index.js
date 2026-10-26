const app = require("../server/dist/server").default || require("../server/dist/server");
const { connectDB } = require("../server/dist/config/db");
let { seedDatabase } = {};
try {
  seedDatabase = require("../server/dist/utils/seed").seedDatabase;
} catch (e) {}

let isSeeded = false;

module.exports = async (req, res) => {
  try {
    await connectDB();
    if (!isSeeded && typeof seedDatabase === "function") {
      await seedDatabase().catch((e) => console.error("[Seed-Error]:", e));
      isSeeded = true;
    }
  } catch (err) {
    console.error("[Vercel-Database-Error]:", err);
    return res.status(500).json({
      success: false,
      message:
        "Database connection failed: " +
        (err.message || String(err)),
    });
  }

  return app(req, res);
};
