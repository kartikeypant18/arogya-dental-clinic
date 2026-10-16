const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 220
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    coverImage: {
      type: String,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    authorName: {
      type: String,
      default: "Dr. Yogesh Tewari"
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("BlogPost", blogPostSchema);
