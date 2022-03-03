const express = require("express");
const router = express.Router();
const { isLoggedIn, roleChecker } = require("../middlewares/userMiddleware");

const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  userInfo,
  updatePassword,
  updateUser,
  getAllUsers,
  getSingleUser,
  adminUpdateUser,
  deleteUser,
  getOnlyUsers,
} = require("../controllers/userController");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/forgotpassword").post(forgotPassword);
router.route("/password/reset/:token").post(resetPassword);
router.route("/logout").get(logout);
router.route("/youraccount").get(isLoggedIn, userInfo);
router.route("/password/update").post(isLoggedIn, updatePassword);
router.route("/updateuser").post(isLoggedIn, updateUser);

//Admin only routes
router.route("/admin/users").get(isLoggedIn, roleChecker("admin"), getAllUsers);
router
  .route("/admin/users/:id")
  .get(isLoggedIn, roleChecker("admin"), getSingleUser)
  .post(isLoggedIn, roleChecker("admin"), adminUpdateUser)
  .delete(isLoggedIn, roleChecker("admin"), deleteUser);
//Manager only routes
router
  .route("/manager/users")
  .get(isLoggedIn, roleChecker("manager"), getOnlyUsers);

module.exports = router;
