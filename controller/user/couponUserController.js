const couponSchema = require("../../model/couponModel");
const cartSchema = require("../../model/cartModel");


const applyCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.session.user;
        const cart = await cartSchema.find({ userId });
        const coupons = await couponSchema.find({});
        const totalPrice = cart[0].cartTotalPrice;

        const matchedCoupon = coupons.find((item) => item.couponCode === code);
        const dateNow = new Date();

        if (!matchedCoupon) {
            return res.status(400).json({ success: false, message: "Invalid coupon code" });
        }

        if (matchedCoupon.endDate <= dateNow || matchedCoupon.usageLimit <= 0) {
            await couponSchema.findByIdAndUpdate(matchedCoupon._id, {
                $set: { status: "Expired" },
            });
            return res.status(400).json({
                success: false,
                message: "The coupon has expired or has reached its usage limit",
            });
        }

        if (totalPrice < matchedCoupon.minValue) {
            return res.status(400).json({
                success: false,
                message: `Total price must meet the minimum value of ₹${matchedCoupon.minValue} to apply the coupon.`,
            });
        }

        const usedByUser = matchedCoupon.usedBy.some((item) => item.toString() === userId);
        if (usedByUser) {
            return res.status(400).json({
                success: false,
                message: "This coupon has already been used by you",
            });
        }

        if (matchedCoupon.discountAmount > totalPrice / 2) {
            
            return res.status(400).json({
                success: false,
                message: "This coupon is not valid for this product!!",
            });
        }

        let totalDiscount = 0;
        if (matchedCoupon.discountType === "Fixed Amount") {
            totalDiscount += matchedCoupon.discountAmount;
        } else {
            const discountPrice = (matchedCoupon.discountAmount / 100) * totalPrice;
            totalDiscount += discountPrice;
        }

        req.session.couponDiscount = totalDiscount;
        console.log(totalDiscount);
        

     
        await couponSchema.findByIdAndUpdate(matchedCoupon._id, {
            $inc: { usageLimit: -1 },
            $push: { usedBy: userId },
        });

        res.status(200).json({ success: true, totalDiscount, message: "Coupon applied successfully" });
    } catch (error) {
        console.log(`Error applying coupon: ${error}`);
        res.status(500).json({ success: false, message: "An error occurred while applying the coupon" });
    }
};



const removeCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.session.user;
        
        
        if (!code) {
            return res.status(400).json({ success: false, message: "Coupon code is required" });
        }
        
        const coupon = await couponSchema.findOne({ couponCode: code });
        if (!coupon) {
            return res.status(400).json({ success: false, message: "Invalid coupon code" });
        }
        
        const usedIndex = coupon.usedBy.findIndex(id => String(id) === String(userId));
        if (usedIndex === -1) {
            return res.status(400).json({ success: false, message: "This coupon is not applied by the user" });
        }
        
        coupon.usedBy = coupon.usedBy.filter(id => String(id) !== String(userId));
        coupon.usageLimit += 1;
        await coupon.save();
        
        const cart = await cartSchema.findOne({ userId });
        if (cart) {
            cart.cartTotalPrice = cart.originalPrice || cart.cartTotalPrice;
            await cart.save();
        }
        
        req.session.couponDiscount = 0;
        
        res.status(200).json({ success: true, message: "Coupon removed successfully" });
    } catch (error) {
        console.error(`Error from removeCoupon: ${error.message}`);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

  

module.exports = {
    applyCoupon, removeCoupon
};
