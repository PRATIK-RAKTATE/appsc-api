import { Question } from "../models/question.model.js";
import { Subject } from "../models/subject.model.js";
import { Topic } from "../models/topic.model.js";
import { SubTopic } from "../models/subTopic.model.js";

export const createQuestion = async (data) => {
  const { subjectID, topicID, subTopic } = data;

  const subject = await Subject.findById(subjectID);

  if (!subject) {
    throw new Error("Subject not found");
  }

  const topic = await Topic.findById(topicID);

  if (!topic) {
    throw new Error("Topic not found");
  }

  if (topic.subjectID.toString() !== subjectID.toString()) {
    throw new Error("Topic does not belong to subject");
  }

  const subTopicDocument = await SubTopic.findById(subTopic);

  if (!subTopicDocument) {
    throw new Error("SubTopic not found");
  }

  if (subTopicDocument.topicID.toString() !== topicID.toString()) {
    throw new Error("SubTopic does not belong to topic");
  }

  return await Question.create(data);
};

export const getQuestions = async (filters = {}) => {
  const query = {};

  if (filters.subjectID) {
    query.subjectID = filters.subjectID;
  }

  if (filters.topicID) {
    query.topicID = filters.topicID;
  }

  if (filters.subTopic) {
    query.subTopic = filters.subTopic;
  }

  return await Question.find(query)
    .populate("subjectID", "subjectName subjectKey")
    .populate("topicID", "topicName topicKey")
    .populate("subTopic", "subTopicName subTopicKey")
    .sort({ createdAt: -1 });
};

export const getQuestionById = async (id) => {
  const question = await Question.findById(id)
    .populate("subjectID", "subjectName subjectKey")
    .populate("topicID", "topicName topicKey")
    .populate("subTopic", "subTopicName subTopicKey");

  if (!question) {
    throw new Error("Question not found");
  }

  return question;
};

export const updateQuestion = async (id, data) => {
  const question = await Question.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  })
    .populate("subjectID", "subjectName subjectKey")
    .populate("topicID", "topicName topicKey")
    .populate("subTopic", "subTopicName subTopicKey");

  if (!question) {
    throw new Error("Question not found");
  }

  return question;
};

export const deleteQuestion = async (id) => {
  const question = await Question.findByIdAndDelete(id);

  if (!question) {
    throw new Error("Question not found");
  }

  return question;
};