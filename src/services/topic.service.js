import { Topic } from "../models/topic.model.js";
import { Subject } from "../models/subject.model.js";


export const  createTopic = async (data) => {
    const { subjectID, topicName, topicKey } = data;

    const subject = await Subject.findById(subjectID);

    if (!subject) {
        throw new Error("Subject not found");
    }

    return await Topic.create(
        {
            subjectID,
            topicName,
            topicKey,
        }
    );
};

export const getTopics = async (subjectID) => {
    const filter = subjectID ? { subjectID } : {};

    return await Topic.find(filter)
        .populate("subjectID", "subjectName subjectKey")
        .sort({ createdAt: -1 });

};

export const getTopicById = async (id) => {
  const topic = await Topic.findById(id).populate(
    "subjectID",
    "subjectName subjectKey",
  );

  if (!topic) {
    throw new Error("Topic not found");
  }

  return topic;
};

export const updateTopic = async (id, data) => {
  const topic = await Topic.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true,
    },
  ).populate("subjectID", "subjectName subjectKey");

  if (!topic) {
    throw new Error("Topic not found");
  }

  return topic;
};

export const deleteTopic = async (id) => {
  const topic = await Topic.findByIdAndUpdate(
    id,
    { isActive: false },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!topic) {
    throw new Error("Topic not found");
  }

  return topic;
};