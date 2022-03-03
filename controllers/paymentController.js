const BigPromise = require("../utils/BigPromise");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const nanoid = require("nanoid");
const Razorpay = require("razorpay");

exports.sendStripeKey = BigPromise(async (req, res, next) => {
  res.status(200).json({
    StripePublicKey: process.env.STRIPE_API_KEY,
  });
});

exports.sendRazorpayKey = BigPromise(async (req, res, next) => {
  res.status(200).json({
    RazorpayPublicKey: process.env.RAZORPAY_API_KEY,
  });
});

exports.captureStripePayment = BigPromise(async (req, res, next) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "inr",
    automatic_payment_methods: { enabled: true },

    //optional//Not gonna lie i got no clue what this line does or is for xD
    metadata: { integration_check: "accept_a_payment" },
  });
  //Stripe payment intent is only generated on successful payments

  res.status(200).json({
    success: true,
    amount: req.body.amount,
    client_secret: paymentIntent.client_secret,
  });
});

exports.captureRazorpayPayment = BigPromise(async (req, res, next) => {
  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_SECRET,
  });

  const order = await instance.orders.create({
    amount: req.body.amount * 100,
    currency: "INR",
    receipt: "xxxxxxxx",
  });

  res.status(200).json({
    success: true,
    amount: req.body.amount,
    order,
  });
});
