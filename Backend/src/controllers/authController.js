const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";

const toPublicUser = (user) => ({
  id: user._id,
  userId: user.userId,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
});

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role = "user", address } = req.body;

    if (!name || !phone || !email || !password || !address) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (!User.roles.includes(role)) {
      return res.status(400).json({ message: "Invalid role selection." });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "An account already exists for this email/phone." });
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
      user: toPublicUser(user),
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
};

exports.login = async (req, res) => {
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
      user: toPublicUser(user),
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
};
