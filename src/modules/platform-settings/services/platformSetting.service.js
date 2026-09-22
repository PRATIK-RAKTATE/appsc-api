import { PlatformSetting } from "../models/platformSetting.model.js";

export const getAllPlatformSettings = async () => {
  return await PlatformSetting.find().sort({ key: 1 }).lean();
};

export const getPlatformSetting = async (key) => {
  const setting = await PlatformSetting.findOne({
    key: key.trim().toLowerCase(),
  }).lean();

  if (!setting) {
    throw new Error("Platform setting not found");
  }

  return setting;
};

export const upsertPlatformSetting = async (
  key,
  value,
  description
) => {
  return await PlatformSetting.findOneAndUpdate(
    {
      key: key.trim().toLowerCase(),
    },
    {
      $set: {
        value,
        ...(description !== undefined ? { description } : {}),
      },
      $setOnInsert: {
        key: key.trim().toLowerCase(),
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).lean();
};

export const updatePlatformSettings = async (settings) => {
  const entries = Object.entries(settings);

  if (entries.length === 0) {
    throw new Error("At least one setting is required");
  }

  const operations = entries.map(([key, value]) => ({
    updateOne: {
      filter: {
        key: key.trim().toLowerCase(),
      },
      update: {
        $set: {
          value,
        },
        $setOnInsert: {
          key: key.trim().toLowerCase(),
        },
      },
      upsert: true,
    },
  }));

  await PlatformSetting.bulkWrite(operations);

  return await getAllPlatformSettings();
};