import {
  createTest,
  getTests,
  getTestById,
  updateTest,
  deleteTest,
} from "../services/test.service.js";

export const createTestController = async (req, res) => {
  try {
    const test = await createTest(req.body);

    return res.status(201).json({
      success: true,
      message: "Test created successfully",
      data: test,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create test",
    });
  }
};

export const getTestsController = async (req, res) => {
  try {
    const tests = await getTests();

    return res.status(200).json({
      success: true,
      data: tests,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch tests",
    });
  }
};

export const getTestByIdController = async (req, res) => {
  try {
    const test = await getTestById(req.params.id);

    return res.status(200).json({
      success: true,
      data: test,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch test",
    });
  }
};

export const updateTestController = async (req, res) => {
  try {
    const test = await updateTest(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Test updated successfully",
      data: test,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update test",
    });
  }
};

export const deleteTestController = async (req, res) => {
  try {
    await deleteTest(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete test",
    });
  }
};