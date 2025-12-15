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

userSchema.pre("save", function (next) {
  if (!this.userId) {
    this.userId = `LP-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  next();
});

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
    const { name, phone, email, password, role = "user", address } = req.body;

    if (!name || !phone || !email || !password || !address) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });
    
    if (existingUser) {
      return res.status(409).json({ message: "An account already exists for this email/phone." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      phone,
      email: email.toLowerCase(),
      passwordHash,
      role,
      address,
    });

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role, userId: user.userId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
      credentials: {
        userId: user.userId,
        password,
      },
      token,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Registration failed. Please try again." });
  }
}