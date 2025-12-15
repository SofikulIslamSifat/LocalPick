const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";
const MONGODB_URI = process.env.MONGODB_URI;

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "shop_owner", "delivery", "admin"], default: "user" },
  address: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();

  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "User ID/email and password required." });
    }

    const user = await User.findOne({
      $or: [{ userId: identifier }, { email: identifier.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role, userId: user.userId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
}