import mongoose, { Schema } from "mongoose";

const subTopicSchema = new Schema(
  {
    topicID: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    subTopicName: {
      type: String,
      required: true,
      trim: true,
    },
    subTopicKey: {
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

subTopicSchema.index(
    { topicID: 1, subTopicKey: 1 }, 
    { unique: true }
);

export const SubTopic = mongoose.model("SubTopic", subTopicSchema);
