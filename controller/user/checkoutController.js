const Address=require('../../model/addressModel')
const Cart= require('../../model/cartModel')
const CouponSchema = require('../../model/couponModel')
const loadCheckout=async(req,res)=>{
 try {
        const userId = req.session.user;
        const addresses = await Address.find({userId});
        const cart=await Cart.findOne({userId}).populate('items.productId');
        const coupons=await CouponSchema.find({isActive:true})
       
        res.render('user/checkout',{
            addresses,cart,coupons
        })
      } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
      }
    
}


module.exports={
    loadCheckout
}