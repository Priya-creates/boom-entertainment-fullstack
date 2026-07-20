const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Purchase must be done by a user"],
  },
  video: {
    type: mongoose.Schema.ObjectId,
    ref: "Video",
    required: [true, "Purchase must be done for a video"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Purchase = mongoose.model("Purchase", purchaseSchema);

purchaseSchema.index({ user: 1, video: 1 }, { unique: true });

module.exports = Purchase;
