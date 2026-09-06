import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const MODULE_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
};

export const MODULE_ITEM_TYPE = {
  BOOK: "BOOK",
  TEST: "TEST",
  VIDEO: "VIDEO",
  CHAPTER: "CHAPTER",
};

export const MODULE_ITEM_MODELS = {
  BOOK: "Book",
  TEST: "Test",
  CHAPTER: "Chapter",
  VIDEO: "Video",
};

const moduleItemSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    itemType: {
      type: String,
      enum: Object.values(MODULE_ITEM_TYPE),
      required: true,
    },

    itemId: {
      type: Schema.Types.ObjectId,
      refPath: "items.itemModel",
    },

    itemModel: {
      type: String,
      enum: Object.values(MODULE_ITEM_MODELS),
    },

    order: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    videoMetadata: {
      videoUrl: {
        type: String,
        trim: true,
      },
      duration: {
        type: Number,
        min: 0,
      },
      r2Key: {
        type: String,
        trim: true,
      },
      thumbnailUrl: {
        type: String,
        trim: true,
      },
    },

    isFreePreview: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const courseModuleSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: Object.values(MODULE_STATUS),
      required: true,
      default: MODULE_STATUS.PUBLISHED,
    },

    items: {
      type: [moduleItemSchema],
      default: () => [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courseModuleSchema.index({ courseId: 1, order: 1 });

courseModuleSchema.virtual("course", {
  ref: "Course",
  localField: "courseId",
  foreignField: "_id",
  justOne: true,
});

courseModuleSchema
  .virtual("bundledItems")
  .get(function () {
    return this.items;
  })
  .set(function (val) {
    this.items = val;
  });

export const CourseModule = model("CourseModule", courseModuleSchema);
