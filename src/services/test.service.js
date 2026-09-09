import { Test } from "../models/test.model.js";

export const createTest = async (data) => {
  const test = await Test.create(data);

  return test;
};

export const getTests = async () => {
  const tests = await Test.find().sort({ createdAt: -1 });

  return tests;
};

export const getTestById = async (testId) => {
  const test = await Test.findById(testId);

  if (!test) {
    const error = new Error("Test not found");
    error.statusCode = 404;
    throw error;
  }

  return test;
};

export const updateTest = async (testId, data) => {
  const test = await Test.findByIdAndUpdate(
    testId,
    data,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!test) {
    const error = new Error("Test not found");
    error.statusCode = 404;
    throw error;
  }

  return test;
};

export const deleteTest = async (testId) => {
  const test = await Test.findByIdAndDelete(testId);

  if (!test) {
    const error = new Error("Test not found");
    error.statusCode = 404;
    throw error;
  }

  return test;
};