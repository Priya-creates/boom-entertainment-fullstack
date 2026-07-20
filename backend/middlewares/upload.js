const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "BoomVideos", // Folder in your Cloudinary account
    resource_type: "video", // Ensures video upload
    allowed_formats: ["mp4"], // Restrict to MP4
    public_id: () => `${Date.now()}-${Math.round(Math.random() * 1e9)}`, // Unique filename
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 300 * 1024 * 1024, // Max 300MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "video/mp4") {
      cb(null, true);
    } else {
      cb(new Error("Only .mp4 videos are allowed!"), false);
    }
  },
});

module.exports = upload;
