import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject
} from "../services/subject.service.js";

export const createSubjectController = async (req, res) => {
  try {
    const { subjectName, subjectKey } = req.body;

    if (!subjectName || !subjectKey) {
      return res.status(400).json({
        success: false,
        message: "subjectNmae and subjectKey are required",
      });
    }

    const subject = await createSubject({
      subjectName,
      subjectKey,
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSubjectsController = async (req, res) => {
  try {
    const subjects = await getSubjects();

    return res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSubjectByIdController = async (req, res) => {
  try {
    const subject = await getSubjectById(req.params.id);

    return res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    const statusCode = error.message === "Subject not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSubjectController = async (req, res) => {
  try {
    const subject = await updateSubject(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
    });
  } catch (error) {
    const statusCode = error.message === "Subject not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSubjectController = async (req, res) => {
  try {
    const subject = await deleteSubject(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Subject deactivated successfully",
      data: subject,
    });
  } catch (error) {
    const statusCode = error.message === "Subject not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}; 
