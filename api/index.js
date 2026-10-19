const app = require("../server/dist/server").default || require("../server/dist/server");
const { connectDB } = require("../server/dist/config/db");
const { seedDatabase } = require("../server/dist/utils/seed");

let isReady = false;

module.exports = async (req, res) => {
  if (!isReady) {
    try {
      await connectDB();
      await seedDatabase();
    } catch (err) {
      console.error("[Vercel-Init-Error]:", err);
    }
    isReady = true;
  }
  return app(req, res);
};
