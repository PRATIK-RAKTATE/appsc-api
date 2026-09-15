import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getPlatformSettingMock,
  upsertPlatformSettingMock,
} = vi.hoisted(() => ({
  getPlatformSettingMock: vi.fn(),
  upsertPlatformSettingMock: vi.fn(),
}));

vi.mock("../services/platformSetting.service.js", () => ({
  getPlatformSetting: getPlatformSettingMock,
  upsertPlatformSetting: upsertPlatformSettingMock,
}));

import {
  getAiSettingsController,
  updateAiSettingsController,
} from "../controllers/aiSetting.controller.js";

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe("AI Setting Controllers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAiSettingsController", () => {
    it("should return existing AI settings", async () => {
      const setting = {
        key: "ai_settings",
        value: { externalWebSearch: true },
      };

      const res = createResponse();

      getPlatformSettingMock.mockResolvedValue(setting);

      await getAiSettingsController({}, res);

      expect(getPlatformSettingMock).toHaveBeenCalledWith("ai_settings");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { externalWebSearch: true },
      });
    });

    it("should return default AI settings when setting is missing", async () => {
      const defaultSetting = {
        key: "ai_settings",
        value: { externalWebSearch: false },
      };

      const res = createResponse();

      getPlatformSettingMock.mockRejectedValue(
        new Error("Platform setting not found")
      );
      upsertPlatformSettingMock.mockResolvedValue(defaultSetting);

      await getAiSettingsController({}, res);

      expect(getPlatformSettingMock).toHaveBeenCalledWith("ai_settings");
      expect(upsertPlatformSettingMock).toHaveBeenCalledWith(
        "ai_settings",
        { externalWebSearch: false },
        "AI feature toggles including external web search"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { externalWebSearch: false },
      });
    });

    it("should return default AI settings when value is not an object", async () => {
      const defaultSetting = {
        key: "ai_settings",
        value: { externalWebSearch: false },
      };

      const res = createResponse();

      getPlatformSettingMock.mockResolvedValue({
        key: "ai_settings",
        value: "invalid",
      });
      upsertPlatformSettingMock.mockResolvedValue(defaultSetting);

      await getAiSettingsController({}, res);

      expect(upsertPlatformSettingMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { externalWebSearch: false },
      });
    });

    it("should return 500 when getPlatformSetting fails", async () => {
      const res = createResponse();

      getPlatformSettingMock.mockRejectedValue(
        new Error("Database error")
      );

      await getAiSettingsController({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  describe("updateAiSettingsController", () => {
    it("should update AI settings successfully", async () => {
      const setting = {
        key: "ai_settings",
        value: { externalWebSearch: true },
      };

      const req = {
        body: {
          externalWebSearch: true,
        },
      };

      const res = createResponse();

      upsertPlatformSettingMock.mockResolvedValue(setting);

      await updateAiSettingsController(req, res);

      expect(upsertPlatformSettingMock).toHaveBeenCalledWith(
        "ai_settings",
        { externalWebSearch: true },
        "AI feature toggles including external web search"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "AI settings updated successfully",
        data: { externalWebSearch: true },
      });
    });

    it("should disable external web search", async () => {
      const setting = {
        key: "ai_settings",
        value: { externalWebSearch: false },
      };

      const req = {
        body: {
          externalWebSearch: false,
        },
      };

      const res = createResponse();

      upsertPlatformSettingMock.mockResolvedValue(setting);

      await updateAiSettingsController(req, res);

      expect(upsertPlatformSettingMock).toHaveBeenCalledWith(
        "ai_settings",
        { externalWebSearch: false },
        "AI feature toggles including external web search"
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 when externalWebSearch is missing", async () => {
      const req = {
        body: {},
      };

      const res = createResponse();

      await updateAiSettingsController(req, res);

      expect(upsertPlatformSettingMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "externalWebSearch boolean is required",
      });
    });

    it("should return 400 when externalWebSearch is not a boolean", async () => {
      const req = {
        body: {
          externalWebSearch: "true",
        },
      };

      const res = createResponse();

      await updateAiSettingsController(req, res);

      expect(upsertPlatformSettingMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "externalWebSearch boolean is required",
      });
    });

    it("should return 500 when upsert fails", async () => {
      const req = {
        body: {
          externalWebSearch: true,
        },
      };

      const res = createResponse();

      upsertPlatformSettingMock.mockRejectedValue(
        new Error("Database error")
      );

      await updateAiSettingsController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });
});
