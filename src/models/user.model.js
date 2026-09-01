import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const USER_ROLES = {
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
  MENTOR: "MENTOR",
};

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
      default: USER_ROLES.STUDENT,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model("User", userSchema);