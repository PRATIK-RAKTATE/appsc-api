import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { CurrentAffairsBookmark } from "../models/currentAffairsBookmark.model.js";

describe("CurrentAffairsBookmark Model", () => {
  const userId = new mongoose.Types.ObjectId();
  const currentAffairsId = new mongoose.Types.ObjectId();

  it("should create a valid bookmark document", async () => {
    const bookmark = new CurrentAffairsBookmark({
      user: userId,
      currentAffairs: currentAffairsId,
    });

    await expect(bookmark.validate()).resolves.toBeUndefined();
    expect(bookmark.user.toString()).toBe(userId.toString());
    expect(bookmark.currentAffairs.toString()).toBe(currentAffairsId.toString());
  });

  it("should require user field", async () => {
    const bookmark = new CurrentAffairsBookmark({
      currentAffairs: currentAffairsId,
    });

    await expect(bookmark.validate()).rejects.toThrow();
  });

  it("should require currentAffairs field", async () => {
    const bookmark = new CurrentAffairsBookmark({
      user: userId,
    });

    await expect(bookmark.validate()).rejects.toThrow();
  });

  it("should have timestamps enabled", () => {
    const bookmark = new CurrentAffairsBookmark({
      user: userId,
      currentAffairs: currentAffairsId,
    });

    expect(bookmark).toHaveProperty("createdAt");
    expect(bookmark).toHaveProperty("updatedAt");
  });
});
