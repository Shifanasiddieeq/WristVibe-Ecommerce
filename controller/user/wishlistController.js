const wishList = require('../../model/wishListModel')
const Productschema = require('../../model/productModel');
const StatusCodes = require('../../utils/statusCode');
const cartSchema = require('../../model/cartModel')

const loadWishlist = async (req, res) => {
  const userId = req.session.user;
  console.log('userId : ',userId)
  try {
      const wishlist = await wishList.findOne({ userID: userId }).populate('items.productID');
     
      res.render('user/wishlist', { wishlist });
  } catch (error) {
      res.status(500).send('Internal server error');
  }
};



const addWishlist = async (req, res) => {
    const userId = req.session.user;
    const productId = req.body.productId;
    const price = req.body.price
    console.log(price);
    
  
    try {
      let wishlist = await wishList.findOne({ userID: userId });
      
      
      if (!wishlist) {
        wishlist = new wishList({ userID: userId, items: [] });
      }
      const exists = wishlist.items.some((item) =>
        item.productID.equals(productId)
      );
      
      if (exists) {
        return res.status(400).json({ message: "Item already in wishlist" });
      }
  
      wishlist.items.push({ productID: productId ,price:price});

      const result = await wishlist.save();

  
      res.status(200).json({ message: "Item added to wishlist" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  };


  const removeWishlist = async (req, res) => {
    try {
      const {  productId } = req.body;
      const userID= req.session.user
  
      const wishlist = await wishList.findOneAndUpdate(
        { userID },
        { $pull: { items: {productID: productId } } },
        { new: true }
      );
  
      if (wishlist) {
        return res
          .status(200)
          .json({success:true, message: "Item removed from wishlist.", wishlist });
      } else {
        return res.status(404).json({ message: "Wishlist not found." });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "An error occurred while removing the item." });
    }
  };

module.exports={
    loadWishlist,addWishlist,
    
    removeWishlist
}