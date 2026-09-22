import mongoose, { Schema } from "mongoose";

const topicSchema = new Schema(
  {
    subjectID: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    topicName: {
      type: String,
      required: true,
      trim: true,
    },
    topicKey: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
  
);

topicSchema.index({ subjectID: 1, topicKey: 1 }, { unique: true });

export const Topic = mongoose.model("Topic", topicSchema);
