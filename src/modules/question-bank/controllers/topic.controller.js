import {
  createTopic,
  getTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
} from "../services/topic.service.js";

export const createTopicController = async (req, res) => {
  try {
    const { subjectID, topicName, topicKey } = req.body;

    if (!subjectID || !topicName || !topicKey) {
      return res.status(400).json({
        success: false,
        message: "subjectId , topicName and topicKey are required",
      });
    }

    const topic = await createTopic({
      subjectID,
      topicName,
      topicKey,
    });

    return res.status(201).json({
      success: true,
      message: "topic created successfully",
      data: topic,
    });
  } catch (error) {
    const statusCode = error.message === "Subject not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTopicsController = async (req, res) => {
  try {
    const topics = await getTopics(req.query.subjectID);

    return res.status(200).json({
      success: true,
      data: topics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTopicByIdController = async (req, res) => {
  try {
    const topic = await getTopicById(req.params.id);

    return res.status(200).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    const statusCode = error.message === "Topic not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTopicController = async (req, res) => {
  try {
    const topic = await updateTopic(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Topic updated successfully",
      data: topic,
    });
  } catch (error) {
    const statusCode = error.message === "Topic not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTopicController = async (req, res) => {
  try {
    const topic = await deleteTopic(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Topic deactivated successfully",
      data: topic,
    });
  } catch (error) {
    const statusCode = error.message === "Topic not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};