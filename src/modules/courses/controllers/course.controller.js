import { Course, COURSE_STATUS } from "../models/course.model.js";

// @desc    Create course package
// @route   POST /api/admin/courses
export const createCourse = async (req, res) => {
  try {
    const course = new Course({
      ...req.body,
      createdBy: req.user._id, // Assuming req.user is populated by protect middleware
    });
    await course.save();
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    List courses
// @route   GET /api/admin/courses
export const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = { isDeleted: false };
    
    if (status) {
      query.status = status;
    }
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const courses = await Course.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    const total = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get course details
// @route   GET /api/admin/courses/:id
export const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("curriculum.refId");
      
    if (!course || course.isDeleted) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update course metadata, validity, and pricing
// @route   PUT /api/admin/courses/:id
export const updateCourse = async (req, res) => {
  try {
    const { title, description, thumbnailUrl, basePrice, discountedPrice, validityInDays } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course || course.isDeleted) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (title) course.title = title;
    if (description) course.description = description;
    if (thumbnailUrl) course.thumbnailUrl = thumbnailUrl;
    if (basePrice !== undefined) course.basePrice = basePrice;
    if (discountedPrice !== undefined) course.discountedPrice = discountedPrice;
    if (validityInDays !== undefined) course.validityInDays = validityInDays;

    await course.save();
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Bundle/reorder items in curriculum
// @route   PUT /api/admin/courses/:id/curriculum
export const updateCurriculum = async (req, res) => {
  try {
    const { curriculum } = req.body; // Expecting array of curriculum items
    const course = await Course.findById(req.params.id);
    
    if (!course || course.isDeleted) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    
    course.curriculum = curriculum;
    await course.save();
    
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Toggle lifecycle status
// @route   PATCH /api/admin/courses/:id/status
export const updateCourseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course || course.isDeleted) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    
    if (status === COURSE_STATUS.PUBLISHED) {
      if (!course.curriculum || course.curriculum.length === 0) {
        return res.status(400).json({ success: false, message: "Cannot publish a course with an empty curriculum" });
      }
    }
    
    course.status = status;
    await course.save();
    
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Soft delete a course
// @route   DELETE /api/admin/courses/:id
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course || course.isDeleted) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    
    course.isDeleted = true;
    course.status = COURSE_STATUS.ARCHIVED;
    await course.save();
    
    res.status(200).json({ success: true, message: "Course soft deleted successfully", data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

