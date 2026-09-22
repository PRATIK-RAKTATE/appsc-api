import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  MentorProfile,
  MENTOR_STATUS,
  MENTOR_APPROVAL_STATUS,
} from "../models/mentorProfile.model.js";

describe("MentorProfile Model", () => {
  const userId = new mongoose.Types.ObjectId();
  const approverId = new mongoose.Types.ObjectId();

  const validProfile = {
    userId,
    bio: "Experienced mentor for APPSC aspirants.",
    expertise: ["POLITY", "ECONOMY"],
    qualifications: ["MA Political Science"],
    languages: ["ENGLISH", "TELUGU"],
    experienceYears: 5,
    status: MENTOR_STATUS.APPROVED,
    approvedAt: new Date(),
    approvedBy: approverId,
    maxMentees: 30,
  };

  it("should validate a completely valid mentor profile", async () => {
    const profile = new MentorProfile(validProfile);
    await expect(profile.validate()).resolves.toBeUndefined();
  });

  it("should apply default values", () => {
    const profile = new MentorProfile({ userId, bio: "Some bio text." });

    expect(profile.status).toBe(MENTOR_STATUS.PENDING);
    expect(profile.expertise).toEqual([]);
    expect(profile.qualifications).toEqual([]);
    expect(profile.languages).toEqual([]);
    expect(profile.experienceYears).toBe(0);
    expect(profile.maxMentees).toBe(50);
    expect(profile.rejectionReason).toBeNull();
    expect(profile.approvedAt).toBeNull();
    expect(profile.approvedBy).toBeNull();
  });

  it("should require userId", async () => {
    const profile = new MentorProfile({ ...validProfile, userId: undefined });
    await expect(profile.validate()).rejects.toThrow(/userId/i);
  });

  it("should require bio", async () => {
    const profile = new MentorProfile({ ...validProfile, bio: undefined });
    await expect(profile.validate()).rejects.toThrow(/bio/i);
  });

  it("should reject an invalid status", async () => {
    const profile = new MentorProfile({ ...validProfile, status: "INVALID_STATUS" });
    await expect(profile.validate()).rejects.toThrow(/status/i);
  });

  it("should reject a bio longer than 2000 characters", async () => {
    const profile = new MentorProfile({ ...validProfile, bio: "a".repeat(2001) });
    await expect(profile.validate()).rejects.toThrow(/bio/i);
  });

  it("should trim bio", () => {
    const profile = new MentorProfile({ userId, bio: "  Mentor bio  " });
    expect(profile.bio).toBe("Mentor bio");
  });

  it("should allow a REJECTED profile with a rejectionReason", async () => {
    const profile = new MentorProfile({
      userId,
      bio: "Rejected applicant.",
      expertise: ["POLITY"],
      languages: ["ENGLISH"],
      status: MENTOR_STATUS.REJECTED,
      rejectionReason: "Insufficient qualifications",
    });
    await expect(profile.validate()).resolves.toBeUndefined();
    expect(profile.rejectionReason).toBe("Insufficient qualifications");
  });

  it("should accept experienceYears as a number", async () => {
    const profile = new MentorProfile({
      ...validProfile,
      experienceYears: 10,
    });
    await expect(profile.validate()).resolves.toBeUndefined();
    expect(profile.experienceYears).toBe(10);
  });

  it("should define timestamp fields", () => {
    expect(MentorProfile.schema.path("createdAt")).toBeDefined();
    expect(MentorProfile.schema.path("updatedAt")).toBeDefined();
  });

  it("should define the expected indexes", () => {
    const indexes = MentorProfile.schema.indexes();

    const userIndex = indexes.find(([fields]) => fields.userId === 1);
    expect(userIndex).toBeDefined();
    expect(userIndex[1].unique).toBe(true);

    const statusExpertiseIndex = indexes.find(
      ([fields]) => fields.status === 1 && fields.expertise === 1,
    );
    expect(statusExpertiseIndex).toBeDefined();
  });

  it("should export all status values via MENTOR_STATUS", () => {
    expect(MENTOR_STATUS.PENDING).toBe("PENDING");
    expect(MENTOR_STATUS.APPROVED).toBe("APPROVED");
    expect(MENTOR_STATUS.REJECTED).toBe("REJECTED");
  });

  it("should export MENTOR_APPROVAL_STATUS as an alias for MENTOR_STATUS", () => {
    expect(MENTOR_APPROVAL_STATUS).toStrictEqual(MENTOR_STATUS);
  });
});
