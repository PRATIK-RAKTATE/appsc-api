import {
  createSubTopic,
  getSubTopics,
  getSubTopicById,
  updateSubTopic,
  deleteSubTopic,
} from "../services/subTopic.service.js";

export const createSubTopicController = async (req, res) => {
  try {
    const { topicID, subTopicName, subTopicKey } = req.body;

    if (!topicID || !subTopicName || !subTopicKey) {
      return res.status(400).json({
        success: false,
        message: "topicID, subTopicName and subTopicKey are required",
      });
    }

    const subTopic = await createSubTopic({
      topicID,
      subTopicName,
      subTopicKey,
    });

    return res.status(201).json({
      success: true,
      message: "SubTopic created successfully",
      data: subTopic,
    });
  } catch (error) {
    const statusCode = error.message === "Topic not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSubTopicsController = async (req, res) => {
  try {
    const subTopics = await getSubTopics(req.query.topicID);

    return res.status(200).json({
      success: true,
      data: subTopics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSubTopicByIdController = async (req, res) => {
  try {
    const subTopic = await getSubTopicById(req.params.id);

    return res.status(200).json({
      success: true,
      data: subTopic,
    });
  } catch (error) {
    const statusCode = error.message === "SubTopic not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSubTopicController = async (req, res) => {
  try {
    const subTopic = await updateSubTopic(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "SubTopic updated successfully",
      data: subTopic,
    });
  } catch (error) {
    const statusCode = error.message === "SubTopic not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSubTopicController = async (req, res) => {
  try {
    const subTopic = await deleteSubTopic(req.params.id);

    return res.status(200).json({
      success: true,
      message: "SubTopic deactivated successfully",
      data: subTopic,
    });
  } catch (error) {
    const statusCode = error.message === "SubTopic not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};
