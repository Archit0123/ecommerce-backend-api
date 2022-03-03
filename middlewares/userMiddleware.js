const BigPromise = require("../utils/BigPromise");
const User = require("../models/User");
const customErr = require("../utils/customErr");
const jwt = require("jsonwebtoken");

exports.isLoggedIn = BigPromise(async (req, res, next) => {
  let token = req.cookies.token || req.body.token;

  console.log(token);
  if (!token) {
    if (req.header("Authorization")) {
      token = req.header("Authorization").replace("Bearer ", "");
    } else {
      return next(
        new customErr(
          "Login verification failed, Please try to login again",
          401
        )
      );
    }
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET); //Getting the token payload via verification with the secret
  //Remember our payload was just the id
  console.log(decoded);
  req.userID = decoded.id; //Injecting the userID that we found into the req to grab it later
  //This is injecting info via middleware

  // req.user= await user.findOne({_id:decoded.id}); //For future rojects use this code instead of above one
  //This helps avoiding weird small bugs.
  console.log(req.userID);
  next();
});

//Here we are using spread operator to automatically add the parameter we recieve in an array
/*Now we're only going to be receiveing one value for role but since its a string it'd be easier to use array functions to check whether the role is valid 
or not. Thus we add one singualr role to an array just to make it simple for us*/
exports.roleChecker = (...roles) => {
  return async (req, res, next) => {
    console.log("function");
    const user = await User.findOne({ _id: req.userID });
    console.log(user);
    if (!user) {
      return next(new customErr("User not found", 401));
    }
    if (!roles.includes(user.role)) {
      return next(
        new customErr("You dont have access to this information", 402)
      );
    }
    next();
  };
};
