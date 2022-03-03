const BigPromise = require("../utils/BigPromise");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const customErr = require("../utils/customErr");
const { cookie } = require("express/lib/response");
const mailHelper = require("../utils/mailHelper");
const crypto = require("crypto");

//register controller
exports.register = BigPromise(async (req, res, next) => {
  const { name, email, password, address } = req.body;
  if (!email || !password || !name) {
    return next(
      new customErr("Name, email and password are all rwequired", 400)
    );
  }
  let imgResult;
  if (req.files) {
    const photo = req.files.photo;
    imgResult = await cloudinary.uploader.upload(photo.tempFilePath, {
      folder: "users",
      crop: "scale",
    });
  }

  console.log(address);

  try {
    const user = await User.create({
      name,
      email,
      password,
      addresses: address,
      photo: {
        id: req.files ? imgResult.public_id : undefined,
        secure_url: req.files ? imgResult.secure_url : undefined,
      },
    });
    console.log(user);

    const token = await user.generateAuthToken();
    res.cookie("token", token, {
      expires: new Date(Date.now() + 10 * 60 * 1000),
      httpOnly: true,
    });

    res.status(201).json({
      success: true,
      message: "user has been successfully created",
    });
  } catch (error) {
    console.log(error);
    if (imgResult) {
      await cloudinary.uploader.destroy(imgResult.public_id);
    }
    next(error);
  }
});

//login controller
exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new customErr("email and password are required", 400));
  }

  const user = await User.findOne({ email }).select("+password"); //this is because by default we have told mongoose not to select password while querying.

  if (!user) {
    return next(new customErr("Invalid credentials", 400));
  }
  const verifyPassword = await user.validatePassword(password);
  if (!verifyPassword) {
    return next(new customErr("Invalid credentials", 400));
  }
  console.log(user);

  const token = await user.generateAuthToken();
  res.cookie("token", token, {
    expires: new Date(Date.now() + 10 * 60 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "user has been logged in",
    token,
  });
});

//logout controller
exports.logout = BigPromise(async (req, res, next) => {
  /*The main thing to remember is the these tokens are pretty much stateless. Once sent to the user,there is no way to overwrite the expiry time of the
   cookie. But what we can do is delete the token in the cookie.*/

  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

//forgot password controller
exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new customErr("email is not registered", 400));
  }

  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  const forgotToken = user.generateForgotPasswordToken();

  await user.save({
    validateBeforeSave: false,
  }); /*When we want to save forgotPasswordToken we are not going to be able to pass all the other validation in the
  schema therefor we use this validateBeforeSave: false so that it saves without the validation*/

  const url = `${req.protocol}1://${req.get(
    "host"
  )}/api/v1/password/reset/${forgotToken}`;

  const message = `Copy Paste this URL in your browser and hit enter \n \n ${url}`;

  /*emailing can fail more often than we would anticipate so we need to try catch it here, because if any error occurs then we need to clear out
  forgot password token and its expiry because user might send another request upon failiure and if we're not clearing these fields then we may clog up the
  server with unhandled requests.*/

  try {
    //Sending the mail
    await mailHelper({
      email: user.email,
      subject: "Forgot Password Request",
      text: message,
    });

    res.status(200).json({
      success: "true",
      message: "Check Your email for further instructions",
    });
  } catch (error) {
    console.log(error);
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new customErr(error.message, 500));
  }
});

//resetPassword
exports.resetPassword = BigPromise(async (req, res, next) => {
  const forgotToken = req.params.token;
  //  The token saved in the database is encrypted so we need it encrypted here in the same way.
  const encryToken = crypto
    .createHash("sha256")
    .update(forgotToken)
    .digest("hex");

  //Now we need to find the user by this token. Also we have to simultaneously check if the token in the databse has expired or not.
  const user = await User.findOne({
    forgotPasswordToken: encryToken,
    forgotPasswordExpiry: { $gt: Date.now() },
    //This is basically a query that finds a user that matches both conditions
    //Condition one: forgotpasswordtoke is same as the encry token
    //Condition two: fogotpassword expiry is greater than Date.now() i.e. token hasnt expired yet.
  });
  // console.log(user);

  if (!user) {
    return next(new customErr("Token invalid or expired, Please retry", 400));
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new customErr("Password and Confirm Password do not match", 400)
    );
  }
  // console.log(req.password);
  user.password = req.body.password;

  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();

  const token = await user.generateAuthToken();
  res
    .cookie("token", token, {
      expires: new Date(Date.now() + 10 * 60 * 1000),
      httpOnly: true,
    })
    .json({
      success: "true",
      token,
      user,
    });
});

//youraccount controller
exports.userInfo = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.userID);
  if (!user) {
    return new customErr("Login failed,please retry login", 400);
  }
  res.status(200).json({
    success: "true",
    user,
  });
});

//update password controller
exports.updatePassword = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.userID).select("+password");
  if (!user) {
    return next(
      new customErr("Login verification failed,Please try again", 500)
    );
  }
  console.log(user);
  const verifyOldPassword = await user.validatePassword(req.body.oldPassword);
  if (!verifyOldPassword) {
    return next(
      new customErr("The original password entered is incorrect", 400)
    );
  }
  if (req.body.newPassword !== req.body.confirmNewPassword) {
    return next(
      new customErr("New Password and confirm New Password dont match", 400)
    );
  }

  user.password = req.body.newPassword;
  await user.save();

  const token = user.generateAuthToken();
  res
    .cookie("token", token, {
      expires: new Date(Date.now() + 10 * 60 * 1000),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Password changed successfully",
      token,
      user,
    });
});

//updateUserInfo controller
exports.updateUser = BigPromise(async (req, res, next) => {
  const user = await User.findOne({ _id: req.userID });
  console.log(user);

  //Updating photo
  if (req.files) {
    if (user.photo.id) {
      const resp = await cloudinary.uploader.destroy(user.photo.id);
    }
    const photo = req.files.photo;
    const imgResult = await cloudinary.uploader.upload(photo.tempFilePath, {
      folder: "users",
      crop: "scale",
    });
    user.photo.id = imgResult.public_id;
    user.photo.secure_url = imgResult.secure_url;
  }

  //Updating username
  if (req.body.name) {
    user.name = req.body.name;
  }

  //Updating useremail
  if (req.body.email) {
    user.email = req.body.email;
  }

  //Adding a single address
  if (req.body.address) {
    user.addresses.push(req.body.address);
  }

  if (req.body.role) {
    user.role = req.body.role;
  }

  const updatedUser = await user.save();
  console.log(updatedUser);

  res.status(200).json({
    success: true,
    updatedUser,
  });

  //TODO: Figure out updating,adding and removing addresses
});

//Admin only route- Getting all the users
exports.getAllUsers = BigPromise(async (req, res, next) => {
  const users = await User.find(); //This Query returns alll the documents of this schema i.e All the users.

  res.status(200).json({
    success: true,
    users,
  });
});

//Admin only route- Getting a single user
exports.getSingleUser = BigPromise(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id });
  if (!user) {
    return next(customErr("User not found", 401));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

//Admin only route- Update a user
exports.adminUpdateUser = BigPromise(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id });
  if (!user) {
    return next(customErr("User not found", 401));
  }
  if (req.body.name) {
    user.name = req.body.name;
  }
  if (req.body.email) {
    user.email = req.body.email;
  }
  if (req.body.role) {
    user.role = req.body.role;
  }
  if (req.files) {
    if (user.photo.id) {
      const resp = await cloudinary.uploader.destroy(user.photo.id);
    }
    const photo = req.files.photo;
    const imgResult = await cloudinary.uploader.upload(photo.tempFilePath, {
      folder: "users",
      crop: "scale",
    });
    user.photo.id = imgResult.public_id;
    user.photo.secure_url = imgResult.secure_url;
  }

  const updatedUser = await user.save();
  res.status(200).json({
    success: true,
    updatedUser,
  });
});

//Admin only route- Delete a user
exports.deleteUser = BigPromise(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id });
  if (!user) {
    return next(new customErr("User not found", 401));
  }

  if (user.photo.id) {
    const resp = await cloudinary.uploader.destroy(user.photo.id);
  }

  const deletedUser = await user.remove();

  console.log(deletedUser);

  //Deleted user immediately gets logged out
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "User deleted successfuly",
  });
});

//Manager only route- getting only user(not managers and admins)
exports.getOnlyUsers = BigPromise(async (req, res, next) => {
  const users = await User.find({ role: "user" }); //This Query returns alll the documents of this schema i.e All the users.

  res.status(200).json({
    success: true,
    users,
  });
});
