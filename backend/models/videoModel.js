const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Video must have a title"],
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, "Every video must have a price"],
      default: 0,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Video must belong to a user"],
    },
    type: {
      type: String,
      enum: ["short", "long"],
      required: [true, "Video must have a type (short or long)"],
    },
    filePath: {
      type: String,
      validate: {
        validator: function (value) {
          if (this.type === "short") {
            return value && value.length > 0;
          }
          return true;
        },
        message: "filePath is required for short videos",
      },
    },
    url: {
      type: String,
      validate: {
        validator: function (value) {
          if (this.type === "long") {
            return value && value.length > 0;
          }
          return true;
        },
        message: "url is required for long videos",
      },
    },
    originalName: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Video = mongoose.model("Video", videoSchema);
module.exports = Video;
