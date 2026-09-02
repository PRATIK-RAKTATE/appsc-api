import mongoose, { Schema } from "mongoose";

const topicSchema = new Schema(
    {
        topicName: {
            type: String,
            required: true,
            trim: true
        },
        topicKey: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: false
        },
        subjectID: {
            type: Schema.Types.ObjectId,
            ref: "Subject"
        }
    },
    { timestamps: true }
);

export const Topic = mongoose.model("Topic", topicSchema);