import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const COURSE_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
};

export const COURSE_ITEM_TYPES = {
  VIDEO: "VIDEO",
  EBOOK: "EBOOK",
  TEST_SERIES: "TEST_SERIES",
  BOOK: "BOOK",
  TEST: "TEST",
};

export const PRICE_CURRENCY = {
  INR: "INR",
};

const curriculumItemSchema = new Schema(
  {
    itemType: {
      type: String,
      enum: ["VIDEO", "EBOOK", "TEST_SERIES"],
      required: true,
    },
    itemTypeRef: {
      type: String,
      enum: ["VideoLecture", "EBook", "TestSeries"],
      required: true,
    },
    refId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "curriculum.itemTypeRef",
    },
    title: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isFreePreview: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
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
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedPrice: {
      type: Number,
      min: 0,
      validate: {
        validator: function (val) {
          if (val == null) return true;
          return val <= this.basePrice;
        },
        message: "discountedPrice must be less than or equal to basePrice",
      },
    },
    validityInDays: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(COURSE_STATUS),
      required: true,
      default: COURSE_STATUS.DRAFT,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    curriculum: [curriculumItemSchema],
  },
  {
    timestamps: true,
  }
);

courseSchema.pre("validate", function () {
  if (this.isModified("title") && !this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
});

export const Course = model("Course", courseSchema);
