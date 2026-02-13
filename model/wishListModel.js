const mongoose = require("mongoose");

const WishlistItemSchema = new mongoose.Schema({
  productID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  price:{
    type:Number,
    required:true
  }
});


const WishlistSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    items: [WishlistItemSchema],
  },
  { timestamps: true }
);

const Wishlist = mongoose.model("Wishlist", WishlistSchema);

module.exports = Wishlist;