const express = require("express");
const router = express.Router();
const { isLoggedIn, roleChecker } = require("../middlewares/userMiddleware");

//Importing product controllers
const {
  addProducts,
  getProducts,
  getSingleProduct,
  adminGetProducts,
  adminGetSingleProduct,
  updateProduct,
  deleteProduct,
  addReview,
  deleteReview,
} = require("../controllers/productController");

//routes
router.route("/products").get(getProducts);
router.route("/products/:id").get(getSingleProduct);
router
  .route("/products/reviews/:productId")
  .put(isLoggedIn, addReview)
  .delete(isLoggedIn, deleteReview);

//Admin only routes
router
  .route("/admin/products/add")
  .post(isLoggedIn, roleChecker("admin"), addProducts);
router
  .route("/admin/products/get")
  .get(isLoggedIn, roleChecker("admin"), adminGetProducts);
router
  .route("/admin/products/:id")
  .get(isLoggedIn, roleChecker("admin"), adminGetSingleProduct)
  .put(isLoggedIn, roleChecker("admin"), updateProduct)
  .delete(isLoggedIn, roleChecker("admin"), deleteProduct);

module.exports = router;
