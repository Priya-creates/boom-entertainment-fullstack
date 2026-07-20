const express = require("express");
const upload = require("../middlewares/upload");
const authController = require("../controllers/authController");
const videoController = require("../controllers/videoController");

const router = express.Router();

router.post(
  "/upload",
  authController.protect,
  upload.single("video"),
  videoController.uploadVideo
);

router.get("/", videoController.getAllVideos);

router.post(
  "/:id/purchase",
  authController.protect,
  videoController.purchaseVideo
);

router.post("/:id/gift", authController.protect, videoController.sendGift);
router.get(
  "/:id/comments",
  authController.protect,
  videoController.getVideoComments
);
router.post(
  "/:id/comment",
  authController.protect,
  videoController.postComment
);

router.patch("/delete/:id", authController.protect, videoController.deleteVideo);
router.get("/:id", authController.protect, videoController.getVideo);
router.patch(
  "/edit/:id",
  authController.protect,
  upload.single("video"),
  videoController.editVideo
);
router.get(
  "/public/:id",
  videoController.getVideoDetailsPublic
);
module.exports = router;
