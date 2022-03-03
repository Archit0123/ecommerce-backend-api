const express = require("express");
const router = express.Router();
const { isLoggedIn, roleChecker } = require("../middlewares/userMiddleware");

const {
  sendRazorpayKey,
  sendStripeKey,
  captureRazorpayPayment,
  captureStripePayment,
} = require("../controllers/paymentController");

router.route("/key/stripe").get(isLoggedIn, sendStripeKey);
router.route("/key/razorpay").get(isLoggedIn, sendRazorpayKey);

router.route("/payment/stripe").post(captureStripePayment);
router.route("/payment/razorpay").post(captureRazorpayPayment);

module.exports = router;
