import mongoose from "mongoose";
import {
  CurrentAffairs,
  CURRENT_AFFAIRS_STATUS,
  RAG_STATUS,
} from "../models/currentAffairs.model.js";
import { Category } from "../models/category.model.js";
import { CurrentAffairsChunk } from "../models/currentAffairsChunk.model.js";
import { scheduleCurrentAffairsRagIngestion } from "../queues/currentAffairsRag.queue.js";

/**
 * Resolves a category by ObjectId or slug.
 * @param {string|mongoose.Types.ObjectId} categoryRef
 * @returns {Promise<Document>}
 */
const resolveCategory = async (categoryRef) => {
  if (!categoryRef) {
    throw new Error("Category is required");
  }

  let category = null;

  if (mongoose.Types.ObjectId.isValid(categoryRef)) {
    category = await Category.findById(categoryRef);
  }

  if (!category && typeof categoryRef === "string") {
    category = await Category.findOne({
      $or: [
        { slug: categoryRef.toLowerCase().trim() },
        { name: categoryRef.trim() },
      ],
    });
  }

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

/**
 * Creates a new Current Affairs article.
 * Automatically triggers RAG ingestion if created directly with status = PUBLISHED.
 * @param {Object} data
 * @returns {Promise<Document>}
 */
export const createCurrentAffairs = async (data) => {
  const category = await resolveCategory(data.category);

  const isPublished = data.status === CURRENT_AFFAIRS_STATUS.PUBLISHED;

  const articleData = {
    ...data,
    category: category._id,
    status: data.status || CURRENT_AFFAIRS_STATUS.DRAFT,
    publishedAt: isPublished ? data.publishedAt || new Date() : null,
    ragStatus: isPublished ? RAG_STATUS.PENDING : RAG_STATUS.PENDING,
  };

  const article = new CurrentAffairs(articleData);
  await article.save();

  if (isPublished) {
    await scheduleCurrentAffairsRagIngestion(article._id);
  }

  return article;
};

/**
 * Publishes an existing Current Affairs article.
 * Automatically queues RAG ingestion upon publication.
 * @param {string|mongoose.Types.ObjectId} id
 * @returns {Promise<Document>}
 */
export const publishCurrentAffairs = async (id) => {
  if (!id) {
    throw new Error("Article ID is required");
  }

  const article = await CurrentAffairs.findById(id);

  if (!article) {
    throw new Error("Current affairs article not found");
  }

  article.status = CURRENT_AFFAIRS_STATUS.PUBLISHED;
  article.publishedAt = new Date();
  article.ragStatus = RAG_STATUS.PENDING;

  await article.save();

  // Automatically triggers BullMQ RAG/vector ingestion queue
  await scheduleCurrentAffairsRagIngestion(article._id);

  return article;
};

/**
 * Fetches an article by its ID.
 * @param {string|mongoose.Types.ObjectId} id
 * @returns {Promise<Document>}
 */
export const getCurrentAffairsById = async (id) => {
  if (!id) {
    throw new Error("Article ID is required");
  }

  const article = await CurrentAffairs.findById(id)
    .populate("category")
    .populate("createdBy", "name email");

  if (!article) {
    throw new Error("Current affairs article not found");
  }

  return article;
};

/**
 * Fetches a list of Current Affairs articles with optional filtering and pagination.
 * @param {Object} filters
 * @param {Object} pagination
 * @returns {Promise<Object>}
 */
export const getCurrentAffairs = async (
  filters = {},
  { page = 1, limit = 10 } = {}
) => {
  const query = {};

  if (filters.category) {
    const category = await resolveCategory(filters.category);
    query.category = category._id;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.tags && filters.tags.length) {
    query.tags = {
      $in: Array.isArray(filters.tags) ? filters.tags : [filters.tags],
    };
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

  const [articles, total] = await Promise.all([
    CurrentAffairs.find(query)
      .populate("category")
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CurrentAffairs.countDocuments(query),
  ]);

  return {
    data: articles,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Updates an existing Current Affairs article.
 * Re-triggers RAG ingestion if published article content/title is modified.
 * @param {string|mongoose.Types.ObjectId} id
 * @param {Object} updateData
 * @returns {Promise<Document>}
 */
export const updateCurrentAffairs = async (id, updateData) => {
  if (!id) {
    throw new Error("Article ID is required");
  }

  const article = await CurrentAffairs.findById(id);

  if (!article) {
    throw new Error("Current affairs article not found");
  }

  if (updateData.category) {
    const category = await resolveCategory(updateData.category);
    updateData.category = category._id;
  }

  const wasPublished = article.status === CURRENT_AFFAIRS_STATUS.PUBLISHED;
  const isNowPublished = updateData.status
    ? updateData.status === CURRENT_AFFAIRS_STATUS.PUBLISHED
    : wasPublished;

  const contentChanged =
    (updateData.content && updateData.content !== article.content) ||
    (updateData.title && updateData.title !== article.title) ||
    (updateData.summary && updateData.summary !== article.summary);

  Object.assign(article, updateData);

  if (!wasPublished && isNowPublished && !article.publishedAt) {
    article.publishedAt = new Date();
  }

  await article.save();

  if (isNowPublished && (!wasPublished || contentChanged)) {
    article.ragStatus = RAG_STATUS.PENDING;
    await article.save();
    await scheduleCurrentAffairsRagIngestion(article._id);
  }

  return article;
};

/**
 * Deletes an article and its associated RAG chunks.
 * @param {string|mongoose.Types.ObjectId} id
 * @returns {Promise<Document>}
 */
export const deleteCurrentAffairs = async (id) => {
  if (!id) {
    throw new Error("Article ID is required");
  }

  const article = await CurrentAffairs.findByIdAndDelete(id);

  if (!article) {
    throw new Error("Current affairs article not found");
  }

  await CurrentAffairsChunk.deleteMany({ currentAffairsId: id });

  return article;
};
