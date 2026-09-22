import mongoose from "mongoose";

const { Schema, model } = mongoose;

const platformSettingSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    value: {
      type: Schema.Types.Mixed,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformSetting = model(
  "PlatformSetting",
  platformSettingSchema
);