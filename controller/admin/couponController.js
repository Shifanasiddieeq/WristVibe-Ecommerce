
const couponSchema = require("../../model/couponModel");

const loadCoupon = async (req, res) => {
    const currentPage = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (currentPage - 1) * limit;
  
    try {
      const coupons = await couponSchema
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const totalCoupons = await couponSchema.countDocuments();
      const totalPages = Math.ceil(totalCoupons / limit);
  
      res.render("admin/coupon", {
        coupons,
        currentPage,
        totalPages,
      });
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  };


  const addCoupon = async (req, res) => {
    const {
      couponCode,
      discountType,
      discountAmount,
      minAmount,
      usageLimit,
      startDate,
      endDate,
    } = req.body;
    console.log(req.body);

    try {

     
        const existingCoupon = await couponSchema.findOne({ couponCode :{ $regex: `^${couponCode}$`, $options: "i" }});
        if (existingCoupon) {
            return res.status(409).json({ 
                message: "Coupon code already exists. Please use a different code.",
            });
          }

      const newCoupon = new couponSchema({
        couponCode,
        discountType,
        discountAmount,
        minAmount,
        usageLimit,
        startDate,
        endDate,
      });
  
      await newCoupon.save();
      res
        .status(201)
        .json({ message: "coupon added successfully", coupon: newCoupon });
    } catch (error) {
      res.status(409).json({ message: "Error adding coupon", error });
      console.error(error);

    }
  };

  const editCoupon = async (req, res) => {
    const {
      couponId,
      couponCode,
      discountType,
      discountAmount,
      minAmount,
      usageLimit,
      startDate,
      endDate,
    } = req.body;
  
    try {

      const existingCoupon = await couponSchema.findOne({
        couponCode: { $regex: `^${couponCode}$`, $options: "i" },
        _id: { $ne: couponId } 
      });
  
      if (existingCoupon) {
        return res.status(400).json({ message: "Coupon code already exists." });
      }

      const updatedCoupon = await couponSchema.findByIdAndUpdate(couponId, {
        couponCode,
        discountType,
        discountAmount,
        minAmount,
        usageLimit,
        startDate,
        endDate,
      }, { new: true });
  
      if (!updatedCoupon) {
        res.status(404).json({ message: "coupon not found" });
      }
  
      res
        .status(200)
        .json({ message: "coupon updated successfully", coupon: updatedCoupon });
    } catch (error) {
      res.status(500).json({ message: "Error updating coupon" });
    }
  };


  const deleteCoupon = async (req, res) => {
    const couponId = req.params.couponId;
  
    try {
      const coupon = await couponSchema.findByIdAndDelete(couponId);
  
      if (!coupon) {
       return res.status(404).json({ message: "coupon not found" });
      }
  
      res.status(200).json({ message: "coupon deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting coupon" });
    }
  };

  module.exports={
    loadCoupon,addCoupon,editCoupon,deleteCoupon
  }