import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const COURSE_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
};

export const COURSE_ITEM_TYPES = {
  BOOK: "BOOK",
  TEST: "TEST",
  VIDEO: "VIDEO",
};

export const PRICE_CURRENCY = {
  INR: "INR",
};

const priceTierSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    validityDays: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: PRICE_CURRENCY.INR,
      uppercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const courseThumbnailSchema = new Schema(
  {
    url: {
      type: String,
      trim: true,
    },
    key: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const courseVideoSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
    },
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
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  },
  { _id: true }
);

const bundledContentSchema = new Schema(
  {
    books: [
      {
        type: Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
    tests: [
      {
        type: Schema.Types.ObjectId,
        ref: "Test",
      },
    ],
    videos: [courseVideoSchema],
  },
  { _id: false }
);

const pricingSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: PRICE_CURRENCY.INR,
      uppercase: true,
      trim: true,
    },
    priceTiers: [priceTierSchema],
  },
  { _id: false }
);

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    thumbnail: {
      type: courseThumbnailSchema,
      default: () => ({}),
      set: (val) => {
        if (typeof val === "string") {
          return { url: val.trim(), key: "" };
        }
        return val;
      },
    },

    validityDays: {
      type: Number,
      required: true,
      min: 1,
      default: 365,
    },

    pricing: {
      type: pricingSchema,
      required: true,
    },

    bundledContent: {
      type: bundledContentSchema,
      default: () => ({ books: [], tests: [], videos: [] }),
    },

    status: {
      type: String,
      enum: Object.values(COURSE_STATUS),
      required: true,
      default: COURSE_STATUS.DRAFT,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courseSchema.index({ status: 1, createdAt: -1 });

courseSchema.virtual("modules", {
  ref: "CourseModule",
  localField: "_id",
  foreignField: "courseId",
  options: { sort: { order: 1 } },
});

export const Course = model("Course", courseSchema);
