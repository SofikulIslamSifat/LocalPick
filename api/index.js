require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("../Backend/src/config/db");
const authRoutes = require("../Backend/src/routes/authRoutes");
const productRoutes = require("../Backend/src/routes/productRoutes");
const orderRoutes = require("../Backend/src/routes/orderRoutes");
const shopRoutes = require("../Backend/src/routes/shopRoutes");
const contactRoutes = require("../Backend/src/routes/contactRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Connect to database
connectDB();

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

module.exports = app;