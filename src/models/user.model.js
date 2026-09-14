import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const USER_ROLES = {
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  MENTOR: "MENTOR",
};

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
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
    
    phone: {
      type: String,
      trim: true,
      index: true,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
      default: USER_ROLES.STUDENT,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    
    suspendedReason: {
      type: String,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model("User", userSchema);