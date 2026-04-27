const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, ...otherDetails } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashed,
      role
    };

    if (role === "candidate") {
      userData.skills = otherDetails.skills || [];
      userData.experience = otherDetails.experience || 0;
      userData.cgpa = otherDetails.cgpa || 0;
    } else if (role === "company") {
      userData.companyName = otherDetails.companyName || "";
      userData.description = otherDetails.description || "";
    }

    const user = await User.create(userData);

    res.status(201).json({ msg: "User registered successfully", userId: user._id });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ msg: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ msg: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
  token,
  role: user.role,
  userId: user._id
});
});

module.exports = router;