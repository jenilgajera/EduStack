// controllers/UserController.js
const Student = require("../models/Student");
const Instructor = require("../models/Instructor");

class UserController {
  static async blockUser(req, res) {
    try {
      const { userId } = req.params;
      const { type } = req.body;
      const Model = type === "student" ? Student : Instructor;
      const user = await Model.findByIdAndUpdate(userId, { isBlocked: true }, { new: true });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ message: `${type} blocked successfully` });
    } catch (error) {
      res.status(500).json({ message: "Error blocking user", error: error.message });
    }
  }

  static async unblockUser(req, res) {
    try {
      const { userId } = req.params;
      const { type } = req.body;
      const Model = type === "student" ? Student : Instructor;
      const user = await Model.findByIdAndUpdate(userId, { isBlocked: false }, { new: true });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ message: `${type} unblocked successfully` });
    } catch (error) {
      res.status(500).json({ message: "Error unblocking user", error: error.message });
    }
  }
}

module.exports = UserController;