require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const shopRoutes = require("./routes/shopRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const frontendDir = path.join(__dirname, "..", "..", "Frontend");
app.use(express.static(frontendDir));

app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendDir, "main", "index.html"));
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "LocalPick API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/contact", contactRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
