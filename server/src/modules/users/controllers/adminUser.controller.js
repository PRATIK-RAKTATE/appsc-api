import { User, USER_ROLES } from "../models/user.model.js";
import { UserSession } from "../../auth/index.js";
import { UserEntitlement } from "../../entitlements/index.js";
import { TestSubmission, SUBMISSION_STATUS } from "../../exams/index.js";

const escapeRegex = (string) => {
  if (!string) return "";
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;

    const query = {};

    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
        { phone: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [enrollments, testStats] = await Promise.all([
      UserEntitlement.find({ userId }).populate("courseId", "title slug status").lean(),
      TestSubmission.aggregate([
        { $match: { studentId: user._id, status: SUBMISSION_STATUS.SUBMITTED } },
        {
          $group: {
            _id: null,
            totalTests: { $sum: 1 },
            avgScore: { $avg: "$score" }
          }
        }
      ])
    ]);

    const stats = testStats.length > 0 ? {
      totalTests: testStats[0].totalTests,
      avgScore: Math.round(testStats[0].avgScore * 100) / 100
    } : { totalTests: 0, avgScore: 0 };

    res.status(200).json({
      success: true,
      data: {
        ...user,
        enrollments,
        testStats: stats
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status, suspendedReason } = req.body;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    if (req.user.userId === userId) {
      return res.status(400).json({ success: false, message: "Cannot modify own status" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({ success: false, message: "Cannot modify SUPER_ADMIN status" });
    }

    user.status = status;
    if (status === "SUSPENDED" || status === "BANNED") {
      user.suspendedReason = suspendedReason || "";
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const revokeUserSessions = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await UserSession.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    res.status(200).json({ success: true, message: "Sessions revoked successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
