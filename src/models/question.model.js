import mongoose, { Schema } from "mongoose";


const bilingualSchema = new schema(
    {
       en: {
        type: String,
        required: true,
        trim: true
       },
       te: {
        type: String,
        required: true,
        trim: true
       } 
    },
    { _id: false }
);


const optionSchema = new schema(
    {
        key: {
            type: String,
            required: true,
            enum: ["A", "B", "C", "D"]
        },

        text: {
            type: bilingualSchema,
            required: true
        },

        weight: {
            type: Number,
            required: true
        }
    },
    { _id: false }
);



const questionSchema = new Schema(
  {
    subjectID: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
    },
    topicID: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
    },
    subTopic: {
      type: Schema.Types.ObjectId,
      ref: "SubTopic",
    },
    question: {
      type: bilingualSchema,
      required: true,
    },
    option: {
      type: [optionSchema],
      required: true,
      validate: {
        validator: function (option) {
          return option.length === 4;
        },
        message: "A question must have exactly 4 options",
      },
    },
    explaination: { 
        type: bilingualSchema,
        required: true
    }
  },
  { timestamps: true },
);

export const Question = mongoose.model("Question", questionSchema);