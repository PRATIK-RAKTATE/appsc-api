import { describe, expect, it } from "vitest";
import {
  Category,
  CURRENT_AFFAIRS_CATEGORIES,
  DEFAULT_CURRENT_AFFAIRS_CATEGORIES,
  seedDefaultCategories,
} from "../models/category.model.js";

describe("Category Model", () => {
  it("should create a valid category", async () => {
    const category = new Category({
      name: "State AP",
      slug: "state-ap",
      description: "Current affairs related to Andhra Pradesh",
    });

    await expect(category.validate()).resolves.toBeUndefined();
  });

  it("should require name", async () => {
    const category = new Category({
      slug: "state-ap",
    });

    await expect(category.validate()).rejects.toThrow();
  });

  it("should require slug", async () => {
    const category = new Category({
      name: "State AP",
    });

    await expect(category.validate()).rejects.toThrow();
  });

  it("should default isActive to true", () => {
    const category = new Category({
      name: "National",
      slug: "national",
    });

    expect(category.isActive).toBe(true);
  });

  it("should define the 4 required current affairs categories", () => {
    expect(CURRENT_AFFAIRS_CATEGORIES).toEqual({
      STATE_AP: "STATE_AP",
      NATIONAL: "NATIONAL",
      ECONOMY: "ECONOMY",
      POLITY: "POLITY",
    });

    expect(DEFAULT_CURRENT_AFFAIRS_CATEGORIES).toHaveLength(4);

    const names = DEFAULT_CURRENT_AFFAIRS_CATEGORIES.map((c) => c.name);
    expect(names).toContain("State AP");
    expect(names).toContain("National");
    expect(names).toContain("Economy");
    expect(names).toContain("Polity");

    const slugs = DEFAULT_CURRENT_AFFAIRS_CATEGORIES.map((c) => c.slug);
    expect(slugs).toContain("state-ap");
    expect(slugs).toContain("national");
    expect(slugs).toContain("economy");
    expect(slugs).toContain("polity");
  });

  it("should seed default categories using bulkWrite", async () => {
    const originalBulkWrite = Category.bulkWrite;
    const originalFind = Category.find;

    try {
      let bulkOps = null;
      Category.bulkWrite = async (ops) => {
        bulkOps = ops;
        return { ok: 1 };
      };
      Category.find = (query) => query;

      const result = await seedDefaultCategories();

      expect(bulkOps).toHaveLength(4);
      expect(bulkOps[0].updateOne.filter.slug).toBe("state-ap");
      expect(result).toBeDefined();
    } finally {
      Category.bulkWrite = originalBulkWrite;
      Category.find = originalFind;
    }
  });
});
