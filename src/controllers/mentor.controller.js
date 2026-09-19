import mongoose from "mongoose";
import { MentorProfile, MENTOR_STATUS } from "../models/mentorProfile.model.js";
import { StudentMentorThread } from "../models/studentMentorThread.model.js";
import { User } from "../models/user.model.js";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Sanitise an array field: accepts an array or a comma-separated string.
const sanitiseStringArray = (value) => {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : String(value).split(",");
  return arr.map((s) => String(s).trim()).filter(Boolean);
};

/**
 * POST /api/mentors/apply
 * Authenticated user submits a mentor application.
 * Upserts MentorProfile with status PENDING.
 * Prevents re-application if already APPROVED.
 */
export const applyForMentor = async (req, res) => {
  try {
    const { bio, expertise, languages, qualifications, experienceYears, maxMentees } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!bio || typeof bio !== "string" || !bio.trim()) {
      return res.status(400).json({ success: false, message: "bio is required" });
    }

    const cleanedExpertise = sanitiseStringArray(expertise);
    if (cleanedExpertise.length === 0) {
      return res.status(400).json({ success: false, message: "expertise is required" });
    }

    const cleanedLanguages = sanitiseStringArray(languages);
    if (cleanedLanguages.length === 0) {
      return res.status(400).json({ success: false, message: "languages is required" });
    }

    // Check for existing approved profile — block re-application
    const existing = await MentorProfile.findOne({ userId });
    if (existing && existing.status === MENTOR_STATUS.APPROVED) {
      return res.status(409).json({
        success: false,
        message: "Your mentor application has already been approved",
      });
    }

    const profileData = {
      bio: bio.trim(),
      expertise: cleanedExpertise,
      languages: cleanedLanguages,
      qualifications: sanitiseStringArray(qualifications),
      experienceYears: Number(experienceYears) || 0,
      maxMentees: maxMentees ? Number(maxMentees) : undefined,
      status: MENTOR_STATUS.PENDING,
      rejectionReason: null,
      approvedAt: null,
      approvedBy: null,
    };

    // Remove undefined keys so they don't overwrite defaults
    Object.keys(profileData).forEach(
      (k) => profileData[k] === undefined && delete profileData[k]
    );

    const profile = await MentorProfile.findOneAndUpdate(
      { userId },
      { $set: profileData },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Mentor application submitted successfully",
      data: profile,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/mentors
 * Public/student-accessible directory of APPROVED mentors.
 * Query params: expertise, language, search (matches user name).
 */
export const browseMentors = async (req, res) => {
  try {
    const { expertise, language, search, page = 1, limit = 20 } = req.query;

    const profileFilter = { status: MENTOR_STATUS.APPROVED };

    if (expertise) {
      profileFilter.expertise = { $in: [expertise] };
    }
    if (language) {
      profileFilter.languages = { $in: [language] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // If a name search is provided we need to join against User first
    if (search) {
      const escapedSearch = escapeRegex(search);
      const matchingUsers = await User.find(
        { name: { $regex: escapedSearch, $options: "i" } },
        "_id"
      ).lean();
      const userIds = matchingUsers.map((u) => u._id);
      profileFilter.userId = { $in: userIds };
    }

    const [profiles, total] = await Promise.all([
      MentorProfile.find(profileFilter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MentorProfile.countDocuments(profileFilter),
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

/**
 * POST /api/mentors/:id/connect
 * Authenticated student selects an approved mentor and initiates a thread.
 * :id is the MentorProfile _id.
 * Body: { initialMessage?: string }
 */
export const connectWithMentor = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.userId;
    const { initialMessage } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid mentor profile ID" });
    }

    const mentorProfile = await MentorProfile.findById(id);
    if (!mentorProfile) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }

    if (mentorProfile.status !== MENTOR_STATUS.APPROVED) {
      return res.status(400).json({
        success: false,
        message: "Cannot connect with a mentor whose application is not approved",
      });
    }

    const mentorUserId = mentorProfile.userId.toString();

    // Prevent self-selection
    if (mentorUserId === String(studentId)) {
      return res.status(400).json({ success: false, message: "You cannot select yourself as a mentor" });
    }

    // Idempotent upsert — compound unique index guarantees at most one thread per pair
    let thread;
    let created = false;

    // Check if thread already exists before upserting so we can return the right status code.
    const existingThread = await StudentMentorThread.findOne({
      studentId: new mongoose.Types.ObjectId(String(studentId)),
      mentorId: mentorProfile.userId,
    });

    if (existingThread) {
      thread = existingThread;
    } else {
      try {
        thread = await StudentMentorThread.create({
          studentId: new mongoose.Types.ObjectId(String(studentId)),
          mentorId: mentorProfile.userId,
          lastMessageAt: new Date(),
        });
        created = true;
      } catch (err) {
        if (err.code === 11000) {
          // Race condition — another request beat us; fetch the existing thread.
          thread = await StudentMentorThread.findOne({
            studentId: new mongoose.Types.ObjectId(String(studentId)),
            mentorId: mentorProfile.userId,
          });
        } else {
          throw err;
        }
      }
    }

    // Attach initial message placeholder to response if provided (actual message persistence
    // belongs to the messaging sub-system, out of scope for this task).
    const responseData = {
      thread,
      mentorProfile,
      ...(initialMessage ? { pendingMessage: initialMessage.trim() } : {}),
    };

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created ? "Thread created successfully" : "Thread already exists",
      data: responseData,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
