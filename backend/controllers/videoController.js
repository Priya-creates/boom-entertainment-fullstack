const mongoose = require("mongoose");
const Video = require("../models/videoModel");
const User = require("../models/userModel");
const Gift = require("../models/giftModel");
const Purchase = require("../models/purchaseModel");
const Comment = require("../models/commentModel");
const { isRateLimited } = require("../utils/rateLimiter");
const sanitizeHtml = require("sanitize-html");
const cloudinary = require("../utils/cloudinary");

exports.uploadVideo = async (req, res) => {
  try {
    const { type, title, url, description, price } = req.body;

    if (!title || !type) {
      return res.status(400).json({ message: "Title and type are required" });
    }

    if (type === "long") {
      if (!url) {
        return res
          .status(400)
          .json({ message: "Long-form video URL is required" });
      }

      const existing = await Video.findOne({
        url,
        creator: req.user.id,
        type: "long",
        isDeleted: false,
      });

      if (existing) {
        return res
          .status(400)
          .json({ message: "You have already uploaded this long-form video." });
      }
    }

    let uploadedFile;
    if (type === "short") {
      if (!req.file || !req.file.path) {
        return res
          .status(400)
          .json({ message: "Short-form video file is required" });
      }

      const existing = await Video.findOne({
        originalName: req.file.originalname,
        creator: req.user.id,
        type: "short",
        isDeleted: false,
      });

      if (existing) {
        return res
          .status(400)
          .json({
            message: "You have already uploaded this short-form video.",
          });
      }
    }

    const newVideo = new Video({
      title,
      description,
      type,
      creator: req.user.id,
      price: Number(price) || 0,
    });

    if (type === "short") {
      newVideo.filePath = req.file.path; // Cloudinary URL
      newVideo.originalName = req.file.originalname;
    } else {
      newVideo.url = url;
    }

    await newVideo.save();

    return res.status(201).json({
      status: "success",
      message: "Video has been successfully uploaded",
      video: newVideo,
    });
  } catch (err) {
    console.error("❌ Upload Error:", err.message);
    return res.status(500).json({
      status: "fail",
      message: err.message || "Internal Server Error",
    });
  }
};

exports.getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find({ isDeleted: false }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ status: "success", data: videos });
  } catch (err) {
    return res
      .status(500)
      .json({
        status: "failure",
        message: err.message || "Internal Server Error",
      });
  }
};

exports.purchaseVideo = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }

    const user = await User.findById(req.user.id);
    const video = await Video.findById(req.params.id);

    if (!video) return res.status(404).json({ message: "Video not found" });

    if (user._id.toString() === video.creator.toString()) {
      return res
        .status(403)
        .json({ message: "You cannot purchase your own video" });
    }

    const purchase = await Purchase.findOne({
      user: user._id,
      video: video._id,
    });
    if (purchase)
      return res
        .status(400)
        .json({ message: "You cannot purchase this video again" });

    if (user.wallet < video.price) {
      return res.status(400).json({ message: "Insufficient Balance" });
    }

    user.wallet -= video.price;
    await user.save();

    await Purchase.create({ user: user._id, video: video._id });

    return res
      .status(200)
      .json({ status: "success", message: "Video successfully purchased" });
  } catch (err) {
    res
      .status(500)
      .json({
        status: "failure",
        message: err.message || "Internal Server Error",
      });
  }
};

exports.sendGift = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }

    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid gift amount" });
    }
    if (amount < 10) {
      return res.status(400).json({ message: "Minimum gifting amount is ₹10" });
    }

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(400).json({ message: "Video not found." });

    const user = await User.findById(req.user.id);
    const creator = await User.findById(video.creator);

    if (user.email === creator.email) {
      return res.status(400).json({ message: "Creator cannot gift himself" });
    }

    if (user.wallet < amount) {
      return res.status(400).json({ message: "Insufficient Balance" });
    }

    user.wallet -= amount;
    await user.save();

    creator.wallet += amount;
    await creator.save();

    await Gift.create({
      from: req.user.id,
      to: video.creator,
      video: req.params.id,
      amount,
    });

    res
      .status(200)
      .json({
        status: "success",
        message: "Gift sent to the creator successfully!",
      });
  } catch (err) {
    res
      .status(500)
      .json({
        status: "failure",
        message: err.message || "Internal server error",
      });
  }
};

exports.getVideoComments = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }

    const comments = await Comment.find({ video: req.params.id })
      .populate("user", "name")
      .sort("-createdAt");

    return res.status(200).json({ status: "success", data: comments });
  } catch (err) {
    return res
      .status(500)
      .json({ status: "failure", message: err || "Internal server error" });
  }
};

exports.postComment = async (req, res) => {
  try {
    let isCreator = false;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }

    const video = await Video.findById(req.params.id);
    const user = await User.findById(req.user.id);
    if (!video || !user)
      return res.status(404).json({ message: "Video or user not found" });

    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    const comment = sanitizeHtml(text);

    if (video.creator.toString() === user._id.toString()) {
      isCreator = true;
    }

    const now = Date.now();
    const limited = isRateLimited(user._id, now);

    if (!limited) {
      if (!comment)
        return res.status(400).json({ message: "Comment cannot be empty" });
      if (comment.length > 200)
        return res
          .status(400)
          .json({ message: "Make a comment of within 200 characters" });

      const commentMade = await Comment.create({
        video: video._id,
        user: user._id,
        text: comment,
        createdAt: now,
      });

      return res
        .status(201)
        .json({ status: "success", data: commentMade, isCreator });
    }

    return res.status(429).json({
      message:
        "Too many comments. Please wait a minute before commenting again",
    });
  } catch (err) {
    return res
      .status(500)
      .json({
        status: "failure",
        message: err.message || "Internal server error",
      });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "No video found" });

    if (req.user.id !== video.creator.toString()) {
      return res.status(403).json({ message: "Video does not belong to you" });
    }

    video.isDeleted = true;
    await video.save();

    return res
      .status(200)
      .json({ status: "success", message: "Video deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({
        status: "failure",
        message: err.message || "Internal server error",
      });
  }
};

exports.getVideo = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (video.price === 0 || req.user.id === video.creator.toString()) {
      return res.status(200).json({ status: "success", data: video });
    }

    const isPurchased = await Purchase.findOne({
      video: video.id,
      user: req.user.id,
    });

    if (!isPurchased) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this video" });
    }

    return res.status(200).json({ status: "success", data: video });
  } catch (err) {
    return res
      .status(500)
      .json({
        status: "failure",
        message: err.message || "Internal server error",
      });
  }
};

exports.getVideoDetailsPublic = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }

    const video = await Video.findById(req.params.id).populate(
      "creator",
      "name"
    );
    if (!video) return res.status(404).json({ message: "Video not found" });

    return res.status(200).json({
      status: "success",
      data: {
        title: video.title,
        type: video.type,
        creator: video.creator.name,
        description: video.description,
        price: video.price,
        createdAt: video.createdAt,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({
        status: "failure",
        message: err.message || "Internal server error",
      });
  }
};

exports.editVideo = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (video.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Video does not belong to you" });
    }

    const body = { ...req.body };
    if (Object.keys(body).length === 0) {
      return res
        .status(400)
        .json({
          message: "At least one property needs to be edited before submitting",
        });
    }

    if (req.file && req.file.path && video.type === "short") {
      body.filePath = req.file.path;
      body.originalName = req.file.originalname;
    }

    const updated = await Video.findByIdAndUpdate(video._id, body, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      status: "success",
      message: "Successfully updated the video",
      data: updated,
    });
  } catch (err) {
    return res
      .status(500)
      .json({
        status: "failure",
        message: err.message || "Internal server error",
      });
  }
};
