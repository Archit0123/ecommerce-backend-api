require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

//For Docs
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//regular middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//cookie parser middlware
app.use(cookieParser());

//fileUpload middleware
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

//morgan middleware
app.use(morgan("tiny"));

//Importing routes//Route used as middleware with this architecture
const home = require("./routes/homeRoutes");
const user = require("./routes/userRoutes");
const product = require("./routes/productRoutes");
const payment = require("./routes/paymentRoutes");
const order = require("./routes/orderRoutes");
const { cookie } = require("express/lib/response");
const User = require("./models/User");

app.use("/api/v1", home);
app.use("/api/v1", user);
app.use("/api/v1", product);
app.use("/api/v1", payment);
app.use("/api/v1", order);
app.get("/test", async (req, res, next) => {
  try {
    throw new Error("Hello");
  } catch (error) {
    next(error);
  }
});

//This is the last middleware. whenever the next keyword is called with an error then this is where it will come for processing.
app.use((err, req, res, next) => {
  console.log(err);

  //Handling errors
  if (err.name === "MongoServerError") {
    if (err.code === 11000) {
      err.code = 400;
      err.message = "User with this email already exists";
    }
    err.code = 500;
  }
  if (err.name === "ValidationError") {
    err.code = 400;
  }
  if (!err.code) {
    err.code = 500;
  }

  //Showing errors
  res.status(err.code).json({
    name: err.name,
    msg: err.message,
    code: err.code,
  });
});
module.exports = app;
