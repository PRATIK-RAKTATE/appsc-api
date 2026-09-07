import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { LeaderboardSnapshot } from "../models/leaderboardSnapshot.model.js";

describe("LeaderboardSnapshot Schema", () => {
  const testId = new mongoose.Types.ObjectId();
  const studentId1 = new mongoose.Types.ObjectId();
  const studentId2 = new mongoose.Types.ObjectId();

  const validSnapshot = {
    testId,
    snapshotAt: new Date(),
    rankings: [
      {
        studentId: studentId1,
        rank: 1,
        score: 95,
      },
      {
        studentId: studentId2,
        rank: 2,
        score: 88,
      },
    ],
  };

  it("should create a valid leaderboard snapshot", () => {
    const snapshot = new LeaderboardSnapshot(validSnapshot);

    expect(snapshot.validateSync()).toBeUndefined();
  });

  it("should require testId", () => {
    const snapshot = new LeaderboardSnapshot({
      ...validSnapshot,
      testId: undefined,
    });

    const error = snapshot.validateSync();

    expect(error.errors.testId).toBeDefined();
  });

  it("should require snapshotAt", () => {
    const snapshot = new LeaderboardSnapshot({
      ...validSnapshot,
      snapshotAt: undefined,
    });

    const error = snapshot.validateSync();

    expect(error.errors.snapshotAt).toBeDefined();
  });

  it("should default rankings to an empty array", () => {
    const snapshot = new LeaderboardSnapshot({
      testId,
      snapshotAt: new Date(),
    });

    expect(snapshot.rankings).toEqual([]);
    expect(snapshot.validateSync()).toBeUndefined();
  });

  it("should require studentId in rankings", () => {
    const snapshot = new LeaderboardSnapshot({
      ...validSnapshot,
      rankings: [
        {
          rank: 1,
          score: 95,
        },
      ],
    });

    const error = snapshot.validateSync();

    expect(error.errors["rankings.0.studentId"]).toBeDefined();
  });

  it("should require rank in rankings", () => {
    const snapshot = new LeaderboardSnapshot({
      ...validSnapshot,
      rankings: [
        {
          studentId: studentId1,
          score: 95,
        },
      ],
    });

    const error = snapshot.validateSync();

    expect(error.errors["rankings.0.rank"]).toBeDefined();
  });

  it("should reject rank less than 1 in rankings", () => {
    const snapshot = new LeaderboardSnapshot({
      ...validSnapshot,
      rankings: [
        {
          studentId: studentId1,
          rank: 0,
          score: 95,
        },
      ],
    });

    const error = snapshot.validateSync();

    expect(error.errors["rankings.0.rank"]).toBeDefined();
  });

  it("should require score in rankings", () => {
    const snapshot = new LeaderboardSnapshot({
      ...validSnapshot,
      rankings: [
        {
          studentId: studentId1,
          rank: 1,
        },
      ],
    });

    const error = snapshot.validateSync();

    expect(error.errors["rankings.0.score"]).toBeDefined();
  });

  it("should reject negative score in rankings", () => {
    const snapshot = new LeaderboardSnapshot({
      ...validSnapshot,
      rankings: [
        {
          studentId: studentId1,
          rank: 1,
          score: -5,
        },
      ],
    });

    const error = snapshot.validateSync();

    expect(error.errors["rankings.0.score"]).toBeDefined();
  });
});