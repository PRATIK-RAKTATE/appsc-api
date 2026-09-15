import mongoose from "mongoose";

const { Schema, model } = mongoose;

const currentAffairsBookmarkSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    currentAffairs: {
      type: Schema.Types.ObjectId,
      ref: "CurrentAffairs",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

currentAffairsBookmarkSchema.index(
  { user: 1, currentAffairs: 1 },
  { unique: true }
);

export const CurrentAffairsBookmark = model(
  "CurrentAffairsBookmark",
  currentAffairsBookmarkSchema
);
