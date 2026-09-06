import { SubTopic } from "../models/subTopic.model.js";
import { Topic } from "../models/topic.model.js";

export const createSubTopic = async (data) => {
  const { topicID, subTopicName, subTopicKey } = data;

  const topic = await Topic.findById(topicID);

  if (!topic) {
    throw new Error("Topic not found");
  }

  return await SubTopic.create({
    topicID,
    subTopicName,
    subTopicKey,
  });
};

export const getSubTopics = async (topicID) => {
  const filter = topicID ? { topicID } : {};

  return await SubTopic.find(filter)
    .populate("topicID", "topicName topicKey subjectID")
    .sort({ createdAt: -1 });
};

export const getSubTopicById = async (id) => {
  const subTopic = await SubTopic.findById(id).populate(
    "topicID",
    "topicName topicKey subjectID",
  );

  if (!subTopic) {
    throw new Error("SubTopic not found");
  }

  return subTopic;
};

export const updateSubTopic = async (id, data) => {
  const subTopic = await SubTopic.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("topicID", "topicName topicKey subjectID");

  if (!subTopic) {
    throw new Error("SubTopic not found");
  }

  return subTopic;
};

export const deleteSubTopic = async (id) => {
  const subTopic = await SubTopic.findByIdAndUpdate(
    id,
    { isActive: false },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!subTopic) {
    throw new Error("SubTopic not found");
  }

  return subTopic;
};
