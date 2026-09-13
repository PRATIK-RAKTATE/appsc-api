import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const CURRENT_AFFAIRS_CATEGORIES = {
  STATE_AP: "STATE_AP",
  NATIONAL: "NATIONAL",
  ECONOMY: "ECONOMY",
  POLITY: "POLITY",
};

export const DEFAULT_CURRENT_AFFAIRS_CATEGORIES = [
  {
    name: "State AP",
    slug: "state-ap",
    description: "Current affairs related to Andhra Pradesh state",
    isActive: true,
  },
  {
    name: "National",
    slug: "national",
    description: "National current affairs and developments",
    isActive: true,
  },
  {
    name: "Economy",
    slug: "economy",
    description: "Economic, financial, and business current affairs",
    isActive: true,
  },
  {
    name: "Polity",
    slug: "polity",
    description: "Indian polity, constitution, and governance",
    isActive: true,
  },
];

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Category = model("Category", categorySchema);

export const seedDefaultCategories = async () => {
  const operations = DEFAULT_CURRENT_AFFAIRS_CATEGORIES.map((cat) => ({
    updateOne: {
      filter: { slug: cat.slug },
      update: { $setOnInsert: cat },
      upsert: true,
    },
  }));

  await Category.bulkWrite(operations);

  return Category.find({
    slug: { $in: DEFAULT_CURRENT_AFFAIRS_CATEGORIES.map((c) => c.slug) },
  });
};