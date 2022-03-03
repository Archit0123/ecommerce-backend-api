const express = require("express");
const router = express.Router();
const { isLoggedIn, roleChecker } = require("../middlewares/userMiddleware");
const { validateOrder } = require("../middlewares/orderValidate");

const {
  createOrder,
  getSingleOrder,
  getMyOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");

router.route("/orders/create").post(isLoggedIn, validateOrder, createOrder);
router.route("/orders/myorder").get(isLoggedIn, getMyOrders);
router.route("/orders/:id").get(isLoggedIn, getSingleOrder);

//admin routes
router
  .route("/admin/orders")
  .get(isLoggedIn, roleChecker("admin"), getAllOrders);
router
  .route("/admin/orders/:id")
  .put(isLoggedIn, roleChecker("admin"), updateOrder);
router
  .route("/admin/orders/:id")
  .delete(isLoggedIn, roleChecker("admin"), deleteOrder);

//Remember that order for routes is important when using params because routes are evaluated in the order in which they are written.
//for eg
//router.route("/orders/:id").get(getSingleOrder);
//router.route("/orders/myorder").get(getSingleOrder);
//If we write the routes in this order then /orders/:id is evaulated first and thus in the route /orders/myorder then myorder is treated as an id
//which is not an id and thus we get an error

module.exports = router;
