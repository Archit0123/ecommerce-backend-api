const BigPromise = require("../utils/BigPromise");
const Order = require("../models/Order");
const customErr = require("../utils/customErr");
const nanoid = require("nanoid");
const Product = require("../models/Product");

exports.createOrder = BigPromise(async (req, res, next) => {
  //Info we want to get from the frontend
  const {
    deliveryAddress,
    products,
    shippingamount,
    taxamount,
    totalamount,
    paymentid,
  } = req.body;

  //I have validated the order in form of a middleware named "orderValidate"

  //Crafting the paymentInfo object
  const paymentinfo = {
    id: paymentid,
    shippingamount,
    taxamount,
    totalamount,
  };
  console.log(paymentinfo);

  const order = await Order.create({
    deliveryAddress,
    products,
    user: req.userID,
    paymentinfo,
  });

  //Updating the product stock accordingly
  order.products.forEach(async (prod) => {
    await updateStock(prod.product, prod.quantity);
  });

  res.status(200).json({
    succes: true,
    order,
  });
});

exports.getSingleOrder = BigPromise(async (req, res, next) => {
  //The populate field expands the user object and adds the name and email field from the User model to the order object.
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new customErr("order not found. please check id", 400));
  }

  res.status(200).json({
    succes: true,
    order,
  });
});

exports.getMyOrders = BigPromise(async (req, res, next) => {
  const orders = await Order.find({ user: req.userID });
  if (!orders) {
    return next(
      new customErr("Something went wrong,Please try logging in again", 401)
    );
  }

  res.status(200).json({
    succes: true,
    orders,
  });
});

//admin get all all orders
exports.getAllOrders = BigPromise(async (req, res, next) => {
  const orders = await Order.find();

  res.status(200).json({
    success: true,
    orders,
  });
});

//admin update Order
//Given the sense and architecture of our application we only want admin to update the order status and update the stock
//which Im doing at the time of order creation.
exports.updateOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (order.status === "delivered") {
    return next(new customErr("Order is already delivered", 400));
  }
  if (req.body.orderStatus) {
    order.status = req.body.orderStatus;
  }
  if (req.body.stock) {
    order.stock = req.body.stock;
  }
  res.status(200).json({
    success: true,
    order,
  });
});

//admin delete order
exports.deleteOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    order,
  });
});

//util function
async function updateStock(productid, quantity) {
  const product = await Product.findByIdAndUpdate(productid, {
    $inc: {
      stock: -quantity,
    },
  });

  console.log(`update stock waala function`);
}
