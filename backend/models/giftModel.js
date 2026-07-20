const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Gift must be given by a user"],
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Gift must be given to someone"],
  },
  amount: {
    type: Number,
    required: [true, "Some amount must be gifted"],
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: [true, "Gift is given for a video"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Gift = mongoose.model("Gift", giftSchema);

module.exports = Gift;
