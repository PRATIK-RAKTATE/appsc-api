import { describe, it, expect } from "vitest";
import { PlatformSetting } from "../models/platformSetting.model.js";

describe("PlatformSetting Schema", () => {
  it("should create a valid platform setting", () => {
    const setting = new PlatformSetting({
      key: "maintenance_mode",
      value: false,
      description: "Controls platform maintenance mode",
    });

    expect(setting.validateSync()).toBeUndefined();
  });

  it("should require key", () => {
    const setting = new PlatformSetting({
      value: false,
    });

    const error = setting.validateSync();

    expect(error.errors.key).toBeDefined();
  });

  it("should require value", () => {
    const setting = new PlatformSetting({
      key: "maintenance_mode",
    });

    const error = setting.validateSync();

    expect(error.errors.value).toBeDefined();
  });

  it("should convert key to lowercase", () => {
    const setting = new PlatformSetting({
      key: "Maintenance_Mode",
      value: true,
    });

    expect(setting.key).toBe("maintenance_mode");
  });

  it("should trim key", () => {
    const setting = new PlatformSetting({
      key: "  support_email  ",
      value: "support@appsc.com",
    });

    expect(setting.key).toBe("support_email");
  });

  it("should support boolean values", () => {
    const setting = new PlatformSetting({
      key: "maintenance_mode",
      value: true,
    });

    expect(setting.validateSync()).toBeUndefined();
  });

  it("should support string values", () => {
    const setting = new PlatformSetting({
      key: "support_email",
      value: "support@appsc.com",
    });

    expect(setting.validateSync()).toBeUndefined();
  });

  it("should support object values", () => {
    const setting = new PlatformSetting({
      key: "contact_info",
      value: {
        email: "support@appsc.com",
        phone: "+91XXXXXXXXXX",
      },
    });

    expect(setting.validateSync()).toBeUndefined();
  });
});