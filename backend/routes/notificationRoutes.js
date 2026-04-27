const express = require("express");
const Notification = require("../models/Notification");

const router = express.Router();

// Get all notifications for a user
router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread count
router.get("/:userId/unread-count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.params.userId, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark single notification as read
router.put("/:id/read", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ msg: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read for a user
router.put("/:userId/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId, read: false }, { read: true });
    res.json({ msg: "All marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
