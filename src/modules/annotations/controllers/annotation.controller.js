import { Annotation, ANNOTATION_TYPE } from "../models/annotation.model.js";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

export const createAnnotation = async (req, res) => {
  try {
    const {
      bookId,
      chapterId,
      type,
      cfiRange,
      pageNumber,
      startOffset,
      endOffset,
      selectedText,
      color,
      noteText,
    } = req.body;

    if (!isValidObjectId(bookId)) {
      return res.status(400).json({ success: false, message: "Invalid bookId" });
    }

    if (type === ANNOTATION_TYPE.BOOKMARK) {
      const existingBookmark = await Annotation.findOne({
        userId: req.user.userId,
        bookId,
        type: ANNOTATION_TYPE.BOOKMARK,
        $or: [
          { chapterId: chapterId || { $exists: false } },
          { pageNumber: pageNumber || null },
          { cfiRange: cfiRange || null },
        ],
      });

      const exactDuplicate = await Annotation.findOne({
        userId: req.user.userId,
        bookId,
        type: ANNOTATION_TYPE.BOOKMARK,
        ...(chapterId ? { chapterId } : {}),
        ...(pageNumber != null ? { pageNumber } : {}),
        ...(cfiRange != null ? { cfiRange } : {}),
      });

      if (exactDuplicate) {
        return res.status(400).json({ success: false, message: "Bookmark already exists for this location" });
      }
    }

    const annotation = await Annotation.create({
      userId: req.user.userId,
      bookId,
      chapterId,
      type,
      cfiRange,
      pageNumber,
      startOffset,
      endOffset,
      selectedText,
      color,
      noteText,
    });

    res.status(201).json({ success: true, data: annotation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getBookAnnotations = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { chapterId, type } = req.query;

    if (!isValidObjectId(bookId)) {
      return res.status(400).json({ success: false, message: "Invalid bookId" });
    }

    const query = {
      userId: req.user.userId,
      bookId,
    };

    if (chapterId) query.chapterId = chapterId;
    if (type) query.type = type;

    const annotations = await Annotation.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: annotations });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAnnotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { noteText, color } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid annotation ID" });
    }

    const annotation = await Annotation.findById(id);

    if (!annotation) {
      return res.status(404).json({ success: false, message: "Annotation not found" });
    }

    if (annotation.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this annotation" });
    }

    if (noteText !== undefined) annotation.noteText = noteText;
    if (color !== undefined) annotation.color = color;

    await annotation.save();

    res.status(200).json({ success: true, data: annotation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAnnotation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid annotation ID" });
    }

    const annotation = await Annotation.findById(id);

    if (!annotation) {
      return res.status(404).json({ success: false, message: "Annotation not found" });
    }

    if (annotation.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this annotation" });
    }

    await annotation.deleteOne();

    res.status(200).json({ success: true, message: "Annotation deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
