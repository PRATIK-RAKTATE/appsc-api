import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  MentorProfile,
  MENTOR_APPROVAL_STATUS,
} from "../models/mentorProfile.model.js";

describe("MentorProfile Model", () => {
  const userId = new mongoose.Types.ObjectId();
  const approverId = new mongoose.Types.ObjectId();

  const validProfile = {
    userId,
    bio: "Experienced mentor for APPSC aspirants.",
    credentials: [
      {
        title: "Master of Arts in Political Science",
        institution: "Andhra University",
        year: 2018,
      },
    ],
    approvalStatus: MENTOR_APPROVAL_STATUS.APPROVED,
    approvedAt: new Date(),
    approvedBy: approverId,
    isActive: true,
  };

  it("should validate a completely valid mentor profile", async () => {
    const profile = new MentorProfile(validProfile);

    await expect(profile.validate()).resolves.toBeUndefined();
  });

  it("should apply default values", () => {
    const profile = new MentorProfile({ userId });

    expect(profile.approvalStatus).toBe(MENTOR_APPROVAL_STATUS.PENDING);
    expect(profile.credentials).toEqual([]);
    expect(profile.isActive).toBe(true);
  });

  it("should require userId", async () => {
    const profile = new MentorProfile({
      ...validProfile,
      userId: undefined,
    });

    await expect(profile.validate()).rejects.toThrow(/userId/i);
  });

  it("should reject an invalid approval status", async () => {
    const profile = new MentorProfile({
      ...validProfile,
      approvalStatus: "INVALID_STATUS",
    });

    await expect(profile.validate()).rejects.toThrow(/approvalStatus/i);
  });

  it("should reject a credential without title or institution", async () => {
    const missingTitle = new MentorProfile({
      ...validProfile,
      credentials: [{ institution: "Andhra University", year: 2018 }],
    });
    const missingInstitution = new MentorProfile({
      ...validProfile,
      credentials: [{ title: "Master's Degree", year: 2018 }],
    });

    await expect(missingTitle.validate()).rejects.toThrow(/title/i);
    await expect(missingInstitution.validate()).rejects.toThrow(/institution/i);
  });

  it("should reject a credential year outside the supported range", async () => {
    const profile = new MentorProfile({
      ...validProfile,
      credentials: [
        {
          title: "Master's Degree",
          institution: "Andhra University",
          year: 1899,
        },
      ],
    });

    await expect(profile.validate()).rejects.toThrow(/year/i);
  });

  it("should reject a bio longer than 2000 characters", async () => {
    const profile = new MentorProfile({
      ...validProfile,
      bio: "a".repeat(2001),
    });

    await expect(profile.validate()).rejects.toThrow(/bio/i);
  });

  it("should trim bio and credential text", () => {
    const profile = new MentorProfile({
      userId,
      bio: "  Mentor bio  ",
      credentials: [
        {
          title: "  Master's Degree  ",
          institution: "  Andhra University  ",
        },
      ],
    });

    expect(profile.bio).toBe("Mentor bio");
    expect(profile.credentials[0].title).toBe("Master's Degree");
    expect(profile.credentials[0].institution).toBe("Andhra University");
  });

  it("should allow a profile to be inactive", async () => {
    const profile = new MentorProfile({
      ...validProfile,
      isActive: false,
    });

    await expect(profile.validate()).resolves.toBeUndefined();
    expect(profile.isActive).toBe(false);
  });

  it("should define timestamp fields", () => {
    expect(MentorProfile.schema.path("createdAt")).toBeDefined();
    expect(MentorProfile.schema.path("updatedAt")).toBeDefined();
  });

  it("should define the expected indexes", () => {
    const indexes = MentorProfile.schema.indexes();

    const userIndex = indexes.find(([fields]) => fields.userId === 1);
    const approvalAndActiveIndex = indexes.find(
      ([fields]) => fields.approvalStatus === 1 && fields.isActive === 1,
    );

    expect(userIndex).toBeDefined();
    expect(userIndex[1].unique).toBe(true);
    expect(approvalAndActiveIndex).toBeDefined();
  });

  it("should export all approval status values", () => {
    expect(MENTOR_APPROVAL_STATUS.PENDING).toBe("PENDING");
    expect(MENTOR_APPROVAL_STATUS.APPROVED).toBe("APPROVED");
    expect(MENTOR_APPROVAL_STATUS.REJECTED).toBe("REJECTED");
  });
});
