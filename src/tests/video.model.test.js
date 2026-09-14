import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { Video, VIDEO_STATUS } from "../models/video.model.js";

describe("Video Model", () => {
  it("validates standalone video curriculum content", async () => {
    const video = new Video({
      title: "Indian polity introduction",
      videoUrl: "https://cdn.example.com/polity.mp4",
      r2Key: "videos/polity.mp4",
      duration: 600,
      status: VIDEO_STATUS.PUBLISHED,
      createdBy: new mongoose.Types.ObjectId(),
    });

    await expect(video.validate()).resolves.toBeUndefined();
  });
});
