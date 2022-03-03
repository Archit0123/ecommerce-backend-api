//This Product model is also called 'Card' model
const { Schema, model } = require("mongoose");

const productSchema = new Schema({
  name: {
    type: String,
    maxlength: [32, "Name is too long. Only 32 characters allowed"],
    required: [true, "Name is required"],
  },
  brand: {
    type: String,
    maxlength: [16, "Brand name is too long.Only 16 characters allowed"],
    required: [true, "Brand name is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
  }, //ADD enum here when u figure out what product u are selling.
  price: {
    type: Number,
    required: [true, "Price is required"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      desc: {
        type: String,
        required: true,
      },
      user: {
        type: Schema.ObjectId,
        ref: "User",
      },
      name: {
        type: String,
      },
      rating: {
        type: Number,
      },
    },
  ],
  photos: [
    {
      id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
  ],
  stock: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: Schema.ObjectId,
    ref: "User",
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    select: false,
  },
});

module.exports = new model("Product", productSchema);
