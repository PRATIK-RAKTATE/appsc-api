import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAllPlatformSettingsMock,
  getPlatformSettingMock,
  upsertPlatformSettingMock,
  updatePlatformSettingsMock,
} = vi.hoisted(() => ({
  getAllPlatformSettingsMock: vi.fn(),
  getPlatformSettingMock: vi.fn(),
  upsertPlatformSettingMock: vi.fn(),
  updatePlatformSettingsMock: vi.fn(),
}));

vi.mock("../services/platformSetting.service.js", () => ({
  getAllPlatformSettings: getAllPlatformSettingsMock,
  getPlatformSetting: getPlatformSettingMock,
  upsertPlatformSetting: upsertPlatformSettingMock,
  updatePlatformSettings: updatePlatformSettingsMock,
}));

import {
  getAllPlatformSettingsController,
  getPlatformSettingController,
  updatePlatformSettingController,
  updatePlatformSettingsController,
} from "../controllers/platformSetting.controller.js";

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe("Platform Setting Controllers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get all platform settings", async () => {
    const settings = [
      {
        key: "maintenance_mode",
        value: false,
      },
      {
        key: "support_email",
        value: "support@appsc.com",
      },
    ];

    const res = createResponse();

    getAllPlatformSettingsMock.mockResolvedValue(settings);

    await getAllPlatformSettingsController({}, res);

    expect(getAllPlatformSettingsMock).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: settings,
    });
  });

  it("should return 500 when getting all platform settings fails", async () => {
    const res = createResponse();

    getAllPlatformSettingsMock.mockRejectedValue(
      new Error("Database error")
    );

    await getAllPlatformSettingsController({}, res);

    expect(getAllPlatformSettingsMock).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error",
    });
  });


  it("should get a platform setting by key", async () => {
    const setting = {
      key: "maintenance_mode",
      value: false,
    };

    const req = {
      params: {
        key: "maintenance_mode",
      },
    };

    const res = createResponse();

    getPlatformSettingMock.mockResolvedValue(setting);

    await getPlatformSettingController(req, res);

    expect(getPlatformSettingMock).toHaveBeenCalledTimes(1);

    expect(getPlatformSettingMock).toHaveBeenCalledWith(
      "maintenance_mode"
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: setting,
    });
  });

  it("should return 404 when platform setting does not exist", async () => {
    const req = {
      params: {
        key: "unknown_setting",
      },
    };

    const res = createResponse();

    getPlatformSettingMock.mockRejectedValue(
      new Error("Platform setting not found")
    );

    await getPlatformSettingController(req, res);

    expect(getPlatformSettingMock).toHaveBeenCalledWith(
      "unknown_setting"
    );

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Platform setting not found",
    });
  });

  it("should return 500 when getting a platform setting fails", async () => {
    const req = {
      params: {
        key: "maintenance_mode",
      },
    };

    const res = createResponse();

    getPlatformSettingMock.mockRejectedValue(
      new Error("Database error")
    );

    await getPlatformSettingController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error",
    });
  });

  it("should update a single platform setting", async () => {
    const setting = {
      key: "maintenance_mode",
      value: true,
      description: "Enable maintenance mode",
    };

    const req = {
      body: {
        key: "maintenance_mode",
        value: true,
        description: "Enable maintenance mode",
      },
    };

    const res = createResponse();

    upsertPlatformSettingMock.mockResolvedValue(setting);

    await updatePlatformSettingController(req, res);

    expect(upsertPlatformSettingMock).toHaveBeenCalledTimes(1);

    expect(upsertPlatformSettingMock).toHaveBeenCalledWith(
      "maintenance_mode",
      true,
      "Enable maintenance mode"
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Platform setting updated successfully",
      data: setting,
    });
  });

  it("should update a single platform setting without description", async () => {
    const setting = {
      key: "maintenance_mode",
      value: true,
    };

    const req = {
      body: {
        key: "maintenance_mode",
        value: true,
      },
    };

    const res = createResponse();

    upsertPlatformSettingMock.mockResolvedValue(setting);

    await updatePlatformSettingController(req, res);

    expect(upsertPlatformSettingMock).toHaveBeenCalledWith(
      "maintenance_mode",
      true,
      undefined
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Platform setting updated successfully",
      data: setting,
    });
  });

  it("should allow false as a valid setting value", async () => {
    const setting = {
      key: "maintenance_mode",
      value: false,
    };

    const req = {
      body: {
        key: "maintenance_mode",
        value: false,
      },
    };

    const res = createResponse();

    upsertPlatformSettingMock.mockResolvedValue(setting);

    await updatePlatformSettingController(req, res);

    expect(upsertPlatformSettingMock).toHaveBeenCalledWith(
      "maintenance_mode",
      false,
      undefined
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should allow null as a setting value", async () => {
    const setting = {
      key: "contact_phone",
      value: null,
    };

    const req = {
      body: {
        key: "contact_phone",
        value: null,
      },
    };

    const res = createResponse();

    upsertPlatformSettingMock.mockResolvedValue(setting);

    await updatePlatformSettingController(req, res);

    expect(upsertPlatformSettingMock).toHaveBeenCalledWith(
      "contact_phone",
      null,
      undefined
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should return 400 when key is missing", async () => {
    const req = {
      body: {
        value: true,
      },
    };

    const res = createResponse();

    await updatePlatformSettingController(req, res);

    expect(upsertPlatformSettingMock).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "key and value are required",
    });
  });

  it("should return 400 when key is empty", async () => {
    const req = {
      body: {
        key: "",
        value: true,
      },
    };

    const res = createResponse();

    await updatePlatformSettingController(req, res);

    expect(upsertPlatformSettingMock).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "key and value are required",
    });
  });

  it("should return 400 when value is missing", async () => {
    const req = {
      body: {
        key: "maintenance_mode",
      },
    };

    const res = createResponse();

    await updatePlatformSettingController(req, res);

    expect(upsertPlatformSettingMock).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "key and value are required",
    });
  });

  it("should return 500 when updating a single platform setting fails", async () => {
    const req = {
      body: {
        key: "maintenance_mode",
        value: true,
      },
    };

    const res = createResponse();

    upsertPlatformSettingMock.mockRejectedValue(
      new Error("Database error")
    );

    await updatePlatformSettingController(req, res);

    expect(upsertPlatformSettingMock).toHaveBeenCalledWith(
      "maintenance_mode",
      true,
      undefined
    );

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error",
    });
  });


  it("should update multiple platform settings", async () => {
    const settings = {
      maintenance_mode: true,
      support_email: "support@appsc.com",
      support_phone: "+91XXXXXXXXXX",
    };

    const updatedSettings = [
      {
        key: "maintenance_mode",
        value: true,
      },
      {
        key: "support_email",
        value: "support@appsc.com",
      },
      {
        key: "support_phone",
        value: "+91XXXXXXXXXX",
      },
    ];

    const req = {
      body: {
        settings,
      },
    };

    const res = createResponse();

    updatePlatformSettingsMock.mockResolvedValue(updatedSettings);

    await updatePlatformSettingsController(req, res);

    expect(updatePlatformSettingsMock).toHaveBeenCalledTimes(1);

    expect(updatePlatformSettingsMock).toHaveBeenCalledWith(
      settings
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Platform settings updated successfully",
      data: updatedSettings,
    });
  });

  it("should accept an empty settings object and let the service validate it", async () => {
    const req = {
      body: {
        settings: {},
      },
    };

    const res = createResponse();

    updatePlatformSettingsMock.mockRejectedValue(
      new Error("At least one setting is required")
    );

    await updatePlatformSettingsController(req, res);

    expect(updatePlatformSettingsMock).toHaveBeenCalledWith({});

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "At least one setting is required",
    });
  });

  it("should return 400 when settings is missing", async () => {
    const req = {
      body: {},
    };

    const res = createResponse();

    await updatePlatformSettingsController(req, res);

    expect(updatePlatformSettingsMock).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "settings object is required",
    });
  });

  it("should return 400 when settings is null", async () => {
    const req = {
      body: {
        settings: null,
      },
    };

    const res = createResponse();

    await updatePlatformSettingsController(req, res);

    expect(updatePlatformSettingsMock).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "settings object is required",
    });
  });

  it("should return 400 when settings is an array", async () => {
    const req = {
      body: {
        settings: [],
      },
    };

    const res = createResponse();

    await updatePlatformSettingsController(req, res);

    expect(updatePlatformSettingsMock).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "settings object is required",
    });
  });

  it("should return 400 when settings is a string", async () => {
    const req = {
      body: {
        settings: "maintenance_mode",
      },
    };

    const res = createResponse();

    await updatePlatformSettingsController(req, res);

    expect(updatePlatformSettingsMock).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "settings object is required",
    });
  });

  it("should return 400 when settings is a number", async () => {
    const req = {
      body: {
        settings: 123,
      },
    };

    const res = createResponse();

    await updatePlatformSettingsController(req, res);

    expect(updatePlatformSettingsMock).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "settings object is required",
    });
  });

  it("should return 500 when updating multiple platform settings fails", async () => {
    const settings = {
      maintenance_mode: true,
    };

    const req = {
      body: {
        settings,
      },
    };

    const res = createResponse();

    updatePlatformSettingsMock.mockRejectedValue(
      new Error("Database error")
    );

    await updatePlatformSettingsController(req, res);

    expect(updatePlatformSettingsMock).toHaveBeenCalledWith(
      settings
    );

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error",
    });
  });
});