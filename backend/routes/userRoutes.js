const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/my-videos", authController.protect, userController.getMyVideos);

router.get(
  "/my-purchases",
  authController.protect,
  userController.getMyPurchases
);

router.post(
  "/recharge-wallet",
  authController.protect,
  userController.rechargeWallet
);

router.get("/nav-details", authController.protect, userController.getNavDetails);

router.delete(
  "/comment/:id",
  authController.protect,
  userController.deleteComment
);

module.exports = router;
