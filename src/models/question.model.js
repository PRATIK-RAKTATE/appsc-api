import mongoose, { Schema } from "mongoose";

// reuseble bilingual structure 
const bilingualSchema = new Schema(
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

// question option structure 
const optionSchema = new Schema(
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


// question schema 
const questionSchema = new Schema(
  {
    subjectID: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    topicID: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },

    subTopic: {
      type: Schema.Types.ObjectId,
      ref: "SubTopic",
      required: true,
      index: true,
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
      required: true,
    },
  },
  { timestamps: true },
);

export const Question = mongoose.model("Question", questionSchema);