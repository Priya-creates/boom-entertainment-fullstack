const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Comment must belong to a user"],
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: [true, "Comment must be given to a video"],
  },
  text: {
    type: String,
    required: [true, "Comment text cannot be empty"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
