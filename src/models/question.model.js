import mongoose, { Schema } from "mongoose";

const questionSchema = new Schema(
    {
        subjectID: { 
            type: Schema.Types.ObjectId,
            ref: "Subject"
        },
        topicID: {
            type: Schema.Types.ObjectId,
            ref: "Topic"
        },
        subTopic: {
            type: Schema.Types.ObjectId,
            ref: "SubTopic"
        },
        question: {

        },
        option: [

        ],
        explaination: 

    },
    { timestamps: true }
);

export const Question = mongoose.model("Question", questionSchema);