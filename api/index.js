const app = require("../server/dist/server").default || require("../server/dist/server");
const { connectDB } = require("../server/dist/config/db");

module.exports = async (req, res) => {
  try {
    await connectDB();
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
