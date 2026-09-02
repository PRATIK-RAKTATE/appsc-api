import mongoose, { Schema } from "mongoose";


const subjectSchema = new Schema(
    {
        subjectName: {
            type: String,
            required: true,
            trim: true
        },
        subjectKey: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: false
        }

    },
    { timestamps: true }
);


export const Subject = mongoose.model("Subject", subjectSchema);