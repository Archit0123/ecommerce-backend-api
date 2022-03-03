const BigPromise = require("../utils/BigPromise");
const Product = require("../models/Product");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const customErr = require("../utils/customErr");
const whereClause = require("../utils/whereClause");

//Getting the Products
exports.getProducts = BigPromise(async (req, res, next) => {
  const resultsPerPage = 2; //This is the number of products we wanna display per page

  let products = new whereClause(Product.find(), req.query).search().filter(); //Getting a whereClause object to work with with the Product model.
  // console.log(await products);

  products.pager(resultsPerPage);
  // console.log(products);
  products = await products.base.select("-__v");

  const countFilteredProducts = products.length;
  console.log(products.length);
  console.log(products);

  res.status(200).json({
    success: true,
    products,
    countFilteredProducts,
  });
});

//Get a single product
exports.getSingleProduct = BigPromise(async (req, res, next) => {
  const product = await Product.find({ _id: req.params.id }).select("-__v");
  if (!product) {
    return next(new customErr("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

//Add a review. Also the way we have written thsi function, it will alow us to update the review here itsels as well
//This will be a put route because we're just updating the review part of the product basically
exports.addReview = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.userID);
  if (!user) {
    return next(new customErr("Something went wrong! Please login again", 500));
  }

  const product = await Product.findById(req.params.productId); //We're getting the product through params in the url
  if (!product) {
    return next(new customErr("Product not found", 501));
  }

  const { rating, desc } = req.body;

  //Constructing the review to be pushed
  const rev = {
    desc,
    user: req.userID,
    name: user.name,
    rating: Number(rating),
  };

  //Now we check if there is already an existing review by this user and then design the fucntionality accordingly
  // We can use the find function of the array which returns in either true or false
  //I haveused a different approach
  //We have to convert the id's to String because ObjectID is stored in BSON fromat in mongoDB by defau
  //Now if there is an existing review by the logged in user then we update that review otherwise we just simply add the review
  product.reviews = product.reviews.filter(
    (review) => review.user.toString() !== req.userID.toString()
  );
  console.log(product.reviews);
  product.reviews.push(rev);

  let totalRating = 0;
  product.reviews.forEach((review) => {
    totalRating = totalRating + review.rating;
  });
  console.log(totalRating);

  product.ratings = totalRating / product.reviews.length;

  const reviwedProduct = await product.save();
  res.status(200).json({
    success: true,
    reviwedProduct,
  });
});

//Deleting a review
exports.deleteReview = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.productId); //We're getting the product through params in the url
  if (!product) {
    return next(new customErr("Product not found", 501));
  }

  product.reviews = product.reviews.filter(
    (review) => review.user.toString() !== req.userID.toString()
  );
  console.log(product.reviews);

  //Updating product ratings
  let totalRating = 0;
  product.reviews.forEach((review) => {
    totalRating = totalRating + review.rating;
  });
  console.log(totalRating);

  product.ratings = totalRating / product.reviews.length;

  const updatedProduct = await product.save();
  console.log(updatedProduct);
  res.status(200).json({
    success: true,
    message: "Successfully deleted the review",
  });
});

//Admin-Adding a product
exports.addProducts = BigPromise(async (req, res, next) => {
  //This time there are lot of properties in req.body so there is no point in destructuring it. We can straight up upload the object
  //that we get from req.body

  let imgArray = [];
  if (req.files) {
    req.files.photos.forEach(async (elem) => {
      const result = await cloudinary.uploader.upload(elem.tempFilePath, {
        folder: "products",
      });
      imgArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    });
  }

  //Now since we already have all the things in req.body already, lets add this photos array to it as well.
  //The validation should be taken care of through BigPromise, customError and mongoose validation that we have used.

  req.body.photos = imgArray;

  //Also we want the user that created this which we can get from out userMiddleware of isLoggedIn
  req.body.createdBy = req.userID;

  try {
    const product = await Product.create(req.body);
    console.log(product);

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.log(error);
    if (imgArray.length !== 0) {
      imgArray.forEach(async (elem) => {
        await cloudinary.uploader.destroy(elem.public_id);
      });
    }
    next(error);
  }
});

//Admin-Get Products. Same as "getProducts" route just this time we also show the version and createdAt field
exports.adminGetProducts = BigPromise(async (req, res, next) => {
  const resultsPerPage = 2; //This is the number of products we wanna display per page

  let products = new whereClause(Product.find(), req.query).search().filter(); //Getting a whereClause object to work with with the Product model.
  // console.log(await products);

  products.pager(resultsPerPage);
  // console.log(products);
  products = await products.base.select("+createdAt");

  const countFilteredProducts = products.length;
  console.log(products.length);
  console.log(products);

  res.status(200).json({
    success: true,
    products,
    countFilteredProducts,
  });
});

//Admin get single product
exports.adminGetSingleProduct = BigPromise(async (req, res, next) => {
  const product = await Product.find({ _id: req.params.id }).select(
    "+createdAt"
  );
  if (!product) {
    return next(new customErr("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

//Admin update product
exports.updateProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new customErr("Product not found", 404));
  }

  //  Checking all the possible update outcomes.. // Just learnt later on we dont need to do this. we can just send the entirity of req.body and
  // all this will be handled automatically. all i need to do is check the photos and then use Product.findByIdAndUpdate().

  if (req.body.name) {
    product.name = req.body.name;
  }
  if (req.body.brand) {
    product.brand = req.body.brand;
  }
  if (req.body.description) {
    product.description = req.body.description;
  }
  if (req.body.category) {
    product.category = req.body.category;
  }
  if (req.body.price) {
    product.price = req.body.price;
  }
  if (req.body.stock) {
    product.stock = req.body.stock;
  }

  let imgArray = [];
  if (req.files) {
    //Deleting existing photos
    if (product.photos.length !== 0) {
      product.photos.forEach(async (elem) => {
        const resp = await cloudinary.uploader.destroy(elem.id);
      });
    }

    //Now adding the new ones

    req.files.photos.forEach(async (elem) => {
      const result = await cloudinary.uploader.upload(elem.tempFilePath, {
        folder: "products",
      });
      imgArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    });
  }
  product.photos = imgArray;

  const updatedProduct = await product.save();

  res.status(200).json({
    success: true,
    updatedProduct,
  });
});

//Admin delete product
exports.deleteProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new customErr("Product not found", 500));
  }
  if (product.photos.length !== 0) {
    product.photos.forEach(async (elem) => {
      const resp = await cloudinary.uploader.destroy(elem.id);
    });
  }
  const result = await product.remove();
  console.log(result);
  res.status(200).json({
    success: true,
    message: "Product successfully deleted",
  });
});
