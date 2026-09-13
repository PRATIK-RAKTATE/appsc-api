import {
  getAllPlatformSettings,
  getPlatformSetting,
  upsertPlatformSetting,
  updatePlatformSettings,
} from "../services/platformSetting.service.js";

export const getAllPlatformSettingsController = async (req, res) => {
  try {
    const settings = await getAllPlatformSettings();

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPlatformSettingController = async (req, res) => {
  try {
    const setting = await getPlatformSetting(req.params.key);

    return res.status(200).json({
      success: true,
      data: setting,
    });
  } catch (error) {
    const statusCode =
      error.message === "Platform setting not found"
        ? 404
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePlatformSettingController = async (req, res) => {
  try {
    const { key, value, description } = req.body;

    if (
      typeof key !== "string" ||
      !key.trim() ||
      value === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "key and value are required",
      });
    }

    const setting = await upsertPlatformSetting(
      key,
      value,
      description
    );

    return res.status(200).json({
      success: true,
      message: "Platform setting updated successfully",
      data: setting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePlatformSettingsController = async (req, res) => {
  try {
    const { settings } = req.body;

    if (
      !settings ||
      typeof settings !== "object" ||
      Array.isArray(settings)
    ) {
      return res.status(400).json({
        success: false,
        message: "settings object is required",
      });
    }

    const updatedSettings =
      await updatePlatformSettings(settings);

    return res.status(200).json({
      success: true,
      message: "Platform settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    const statusCode =
      error.message === "At least one setting is required"
        ? 400
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};