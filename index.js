require("dotenv").config();
const app = require("./app");
const dbConn = require("./conifg/dbConn");
const cloudinary = require("cloudinary").v2;

dbConn();

cloudinary.config({
  cloud_name: "primitivesinc1",
  api_key: "122328555334771",
  api_secret: "tehuMVeJSwaYuhH1J8vz0kCGtTU",
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running at port ${process.env.PORT}`);
});
