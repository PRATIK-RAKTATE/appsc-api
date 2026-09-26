import {
  toggleBookmark,
  isBookmarked,
  getUserBookmarks,
} from "../services/currentAffairsBookmark.service.js";

export const toggleBookmarkController = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { currentAffairsId } = req.params;

    const result = await toggleBookmark(userId, currentAffairsId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle bookmark",
    });
  }
};

export const checkBookmarkController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { currentAffairsId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const bookmarked = await isBookmarked(userId, currentAffairsId);

    return res.status(200).json({
      success: true,
      data: { bookmarked },
    });
  } catch (error) {
    console.error("Check bookmark error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to check bookmark status",
    });
  }
};

export const getUserBookmarksController = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { page, limit } = req.query;

    const result = await getUserBookmarks(userId, { page, limit });

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
    console.error("Get user bookmarks error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bookmarks",
    });
  }
};
