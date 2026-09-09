import { seedDefaultCategories, Category } from "../models/category.model.js";

export const seedCategories = async () => {
  return seedDefaultCategories();
};

export default seedCategories;
