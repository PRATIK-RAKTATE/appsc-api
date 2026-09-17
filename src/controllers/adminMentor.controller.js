import { MentorProfile, MENTOR_STATUS } from "../models/mentorProfile.model.js";
import { User, USER_ROLES } from "../models/user.model.js";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));

/**
 * PATCH /api/admin/mentors/:id/status
 * Admin approves or rejects a mentor application.
 * :id is the MentorProfile _id.
 * Body: { status: 'APPROVED' | 'REJECTED', rejectionReason?: string }
 */
export const updateMentorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user.userId;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid mentor profile ID" });
    }

    if (!status || ![MENTOR_STATUS.APPROVED, MENTOR_STATUS.REJECTED].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be 'APPROVED' or 'REJECTED'",
      });
    }

    if (status === MENTOR_STATUS.REJECTED && (!rejectionReason || !String(rejectionReason).trim())) {
      return res.status(400).json({
        success: false,
        message: "rejectionReason is required when rejecting an application",
      });
    }

    const mentorProfile = await MentorProfile.findById(id);
    if (!mentorProfile) {
      return res.status(404).json({ success: false, message: "Mentor profile not found" });
    }

    if (status === MENTOR_STATUS.APPROVED) {
      mentorProfile.status = MENTOR_STATUS.APPROVED;
      mentorProfile.approvedAt = new Date();
      mentorProfile.approvedBy = adminId;
      mentorProfile.rejectionReason = null;

      // Promote the user's role to MENTOR
      await User.findByIdAndUpdate(mentorProfile.userId, { role: USER_ROLES.MENTOR });
    } else {
      mentorProfile.status = MENTOR_STATUS.REJECTED;
      mentorProfile.rejectionReason = String(rejectionReason).trim();
      mentorProfile.approvedAt = null;
      mentorProfile.approvedBy = null;
    }

    await mentorProfile.save();

    const updatedProfile = await MentorProfile.findById(id)
      .populate("userId", "name email role")
      .lean();

    return res.status(200).json({
      success: true,
      message: `Mentor application ${status.toLowerCase()}`,
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/mentors
 * Admin lists all mentor applications (all statuses).
 * Query params: status, page, limit
 */
export const listMentorApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && Object.values(MENTOR_STATUS).includes(status)) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [profiles, total] = await Promise.all([
      MentorProfile.find(filter)
        .populate("userId", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MentorProfile.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: profiles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
