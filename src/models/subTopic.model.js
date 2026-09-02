import mongoose, { Schema } from "mongoose";

const subTopicSchema = new Schema(
    {
        subTopicName: {
            type: String,
            required: true,
            trim: true
        },
        subTopicKey: {
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
        topicID: {
            type: Schema.Types.ObjectId,
            ref: "Topic"
        }   
    },
    { timestamps: true }
);

export const SubTopic = mongoose.model("SubTopic", subTopicSchema);