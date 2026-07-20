const mongoose = require("mongoose");
const Video = require("../models/videoModel");
const Purchase = require("../models/purchaseModel");
const User = require("../models/userModel");
const Comment = require("../models/commentModel");
const { deleteComment } = require("../utils/rateLimiter");

exports.getMyVideos = async (req, res) => {
  try {
    const videos = await Video.find({
      creator: req.user.id,
      isDeleted: false,
    })
      .populate("creator", "name")
      .sort({ createdAt: -1 });   

    if (videos.length === 0) {
      return res.status(404).json({
        message: "No videos uploaded by you",
      });
    }
    return res.status(200).json({
      status: "success",
      data: videos,
    });
  } catch (err) {
    return res.status(500).json({
      status: "failure",
      message: err.message || "Internal server error",
    });
  }
};

exports.getMyPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user.id }).populate([
      {
        path: "video",
        populate: {
          path: "creator",
          select: "name type",
        },
      },
      {
        path: "user",
        select: "name",
      },
    ]);
    if (purchases.length === 0) {
      return res.status(404).json({
        message: "No purchases made by you",
      });
    }
    return res.status(200).json({
      status: "success",
      data: purchases,
    });
  } catch (err) {
    return res.status(500).json({
      status: "failure",
      message: err.message || "Internal Server Error",
    });
  }
};

exports.getNavDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    return res.status(200).json({
      status: "success",
      wallet: Number(user.wallet),
      name: user.name,
      id: user._id,
    });
  } catch (err) {
    return res.status(500).json({
      status: "failure",
      message: err.message || "Internal server error",
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid Comment ID" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Comment does not belong to you",
      });
    }

    await comment.deleteOne();
    deleteComment(
      comment.user.toString(),
      new Date(comment.createdAt).getTime()
    );

    return res.status(200).json({
      status: "success",
      message: "Comment deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      status: "failure",
      message: err.message || "Internal server error",
    });
  }
};

exports.rechargeWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || isNaN(numericAmount)) {
      return res.status(400).json({
        message: "Amount must be a valid number",
      });
    }

    if (numericAmount > 1000) {
      return res.status(400).json({
        message: "Cannot recharge for more than 1000 rupees",
      });
    }

    const user = await User.findById(req.user.id);
    user.wallet += numericAmount;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Your wallet has been successfully recharged",
      data: user.wallet,
    });
  } catch (err) {
    return res.status(500).json({
      status: "failure",
      message: err.message || "Internal server error",
    });
  }
};
