import {
  createCurrentAffairs,
  publishCurrentAffairs,
  getCurrentAffairsById,
  getCurrentAffairs,
  updateCurrentAffairs,
  deleteCurrentAffairs,
} from "../services/currentAffairs.service.js";

export const createCurrentAffairsController = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      summary,
      tags,
      status,
      source,
      sourceUrl,
      coverImageUrl,
      attachments,
    } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, content, and category are required",
      });
    }

    const createdBy = req.user?.userId || req.body.createdBy;

    if (!createdBy) {
      return res.status(400).json({
        success: false,
        message: "CreatedBy user ID is required",
      });
    }

    const article = await createCurrentAffairs({
      title,
      content,
      category,
      summary,
      tags,
      status,
      source,
      sourceUrl,
      coverImageUrl,
      attachments,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Current affairs article created successfully",
      data: article,
    });
  } catch (error) {
    console.error("Create Current Affairs error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create current affairs article",
    });
  }
};

export const publishCurrentAffairsController = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await publishCurrentAffairs(id);

    return res.status(200).json({
      success: true,
      message: "Current affairs article published and RAG ingestion queued",
      data: article,
    });
  } catch (error) {
    console.error("Publish Current Affairs error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to publish current affairs article",
    });
  }
};

export const getCurrentAffairsByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await getCurrentAffairsById(id);

    return res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error("Get Current Affairs by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch current affairs article",
    });
  }
};

export const getCurrentAffairsController = async (req, res) => {
  try {
    const { category, status, tags, search, page, limit } = req.query;

    const result = await getCurrentAffairs(
      {
        category,
        status,
        tags: tags ? tags.split(",") : undefined,
        search,
      },
      { page, limit }
    );

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("Get Current Affairs list error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch current affairs articles",
    });
  }
};

export const updateCurrentAffairsController = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await updateCurrentAffairs(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Current affairs article updated successfully",
      data: article,
    });
  } catch (error) {
    console.error("Update Current Affairs error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update current affairs article",
    });
  }
};

export const deleteCurrentAffairsController = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await deleteCurrentAffairs(id);

    return res.status(200).json({
      success: true,
      message: "Current affairs article deleted successfully",
      data: article,
    });
  } catch (error) {
    console.error("Delete Current Affairs error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete current affairs article",
    });
  }
};
