import {
  getPlatformSetting,
  upsertPlatformSetting,
} from "../services/platformSetting.service.js";

export const getAiSettingsController = async (req, res) => {
  try {
    let setting;

    try {
      setting = await getPlatformSetting("ai_settings");
    } catch (error) {
      if (error.message === "Platform setting not found") {
        setting = null;
      } else {
        throw error;
      }
    }

    if (!setting || typeof setting.value !== "object" || setting.value === null) {
      const defaultSetting = await upsertPlatformSetting(
        "ai_settings",
        { externalWebSearch: false },
        "AI feature toggles including external web search"
      );

      return res.status(200).json({
        success: true,
        data: defaultSetting.value,
      });
    }

    return res.status(200).json({
      success: true,
      data: setting.value,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAiSettingsController = async (req, res) => {
  try {
    const { externalWebSearch } = req.body;

    if (typeof externalWebSearch !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "externalWebSearch boolean is required",
      });
    }

    const setting = await upsertPlatformSetting(
      "ai_settings",
      { externalWebSearch },
      "AI feature toggles including external web search"
    );

    return res.status(200).json({
      success: true,
      message: "AI settings updated successfully",
      data: setting.value,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
