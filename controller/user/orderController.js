const Order = require('../../model/orderModel')
const Cart = require('../../model/cartModel')
const User = require('../../model/userModel')
const Product = require('../../model/productModel')
const StatusCodes = require('../../utils/statusCode');
const { countDocuments } = require('../../model/adminModel');

const walletSchema = require('../../model/walletModel');
const orderModel = require('../../model/orderModel');
const couponSchema = require('../../model/couponModel')
const offerSchema = require('../../model/offerModel')
const PDFDocument = require('pdfkit');
const fs = require('fs');




const placeOrder = async (req, res) => {
  try {
    const { address, payment, totalPrice ,paymentStatus} = req.body;
 
    const userId = req.session.user;

    const cart = await Cart.findOne({ userId }).populate('items.productId', 'productName images price stockCount');


    if (!cart || cart.items.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).send('Cart is empty');
    }

    const user = await User.findById(userId);

    const shippingfee = cart.cartTotalPrice < 250 ? 40 : 0
    const couponDiscount = req.session.couponDiscount ? req.session.couponDiscount : 0
    const OrderTotalPrice = (cart.cartTotalPrice + shippingfee) - couponDiscount
    console.log(couponDiscount);


    const productIds = cart.items.map(item => item.productId._id)
    
    const offers = await offerSchema.find({
      selectedProducts: { $in: productIds }
    });

    const offerDiscount = offers.reduce((acc,item) => acc + item.discountAmount, 0)



    let orderData = {};

      // Wallet payment 
      if (payment === 'WALLET') {
        const wallet = await walletSchema.findOne({ userId });
          
        
  
        if (wallet.balance < OrderTotalPrice) {
          return res.status(400).json({
            message: `Insufficient wallet balance for this order. Your current balance is ₹${wallet.balance}.`,
          });
        }
  
        wallet.balance -= OrderTotalPrice;
  
        wallet.transactions.push({
          amount: OrderTotalPrice,
          type: "debit",
          description: "Debited by Order Payment",
          date: new Date(),
        });
  
        await wallet.save();

        orderData = {
          userId,
          customer: {
            userName: user.name,
            email: user.email,
            address: address
          },
          products: cart.items.map((item) => ({
            productId: item.productId._id,
            productName: item.productId.productName,
            image: item.productId.images[0],
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          })),
          totalPrice: OrderTotalPrice,
          paymentMethod: payment,
          paymentStatus,
          couponDiscount: req.session.couponDiscount,
          offerDiscount,
        };

      }else if(payment == 'COD'){
      
      orderData = {
        userId,
        customer: {
          userName: user.name,
          email: user.email,
          address: address
        },
        products: cart.items.map((item) => ({
          productId: item.productId._id,
          productName: item.productId.productName,
          image: item.productId.images[0],
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        totalPrice:  OrderTotalPrice,
        paymentMethod: payment,
        paymentStatus ,
        couponDiscount : req.session.couponDiscount,
        offerDiscount,
      }
    } else if(payment == 'RAZORPAY'){
      orderData = {
        userId,
        customer: {
          userName: user.name,
          email: user.email,
          address: address
        },
        products: cart.items.map((item) => ({
          productId: item.productId._id,
          productName: item.productId.productName,
          image: item.productId.images[0],
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        totalPrice:OrderTotalPrice,
        paymentMethod: payment,
        paymentStatus,
        couponDiscount : req.session.couponDiscount,
        offerDiscount,
      };
    }

    

    for (item of cart.items) {

      let product = item.productId



      product.stockCount -= item.quantity
      await product.save()


    }

    for (const item of cart.items) {
      const product = item.productId;


      if (product.quantity < item.quantity) {
        return res.status(StatusCodes.BAD_REQUEST).send(`Insufficient stock for ${product.productName}`);
      }

      product.quantity -= item.quantity;
      await product.save();
    }


    const order = new Order(orderData);
    await order.save();
    req.session.couponDiscount = 0;


    await Cart.findOneAndUpdate({ userId }, { items: [], cartTotalPrice: 0 });
    
    const redirect = `/orderSuccess/${order._id}`
    res.status(200).json({ success: true, redirect })
    

  } catch (err) {
    console.error(`error from order success : ${err}`);
    res.status(500).send('Server Error');
  }
}; 


const getOrders = async (req, res) => {
  try {
    const userId = req.session.user;



    const user = await User.findById(userId);
    const page = parseInt(req.query.page) || 1
    const limit = 3
    const skip = (page - 1) * limit
    const totalOrders = await Order.countDocuments({ userId })

    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalPages = Math.ceil(totalOrders / limit)

    res.render('user/orders', {
      user,
      orders,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};



const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    for (const product of order.products) {
      const productDoc = await Product.findById(product.productId);

      if (!productDoc) {
        console.warn(`Product with ID ${product.productId} not found.`);
        continue; 
      }

      productDoc.stockCount += product.quantity;
      await productDoc.save();
    }

    order.status = 'Cancelled';
    await order.save();

    const wallet = await walletSchema.findOne({ userId: order.userId });

    if (order.paymentMethod === 'RAZORPAY' || order.paymentMethod === 'WALLET') {
      const refundDescription =
        order.paymentMethod === 'RAZORPAY'
          ? `Refund for cancelled order: ${orderId}`
          : `Refund for wallet cancel order: ${orderId}`;

      if (wallet) {
        wallet.balance += order.totalPrice;
        wallet.transactions.push({
          type: 'credit',
          amount: order.totalPrice,
          description: refundDescription,
        });
        await wallet.save();
      } else {
        await walletSchema.create({
          userId: order.userId,
          balance: order.totalPrice,
          transactions: [
            {
              type: 'credit',
              amount: order.totalPrice,
              description: refundDescription,
            },
          ],
        });
      }
    }

    res.json({
      message:
        'Order cancelled successfully, stock updated, and refund processed if applicable',
    });
  } catch (err) {
    console.error('Error cancelling order:', err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
};
 


const loadSuccess = async (req, res) => {
  try {
    const orderId = req.params.orderId
    const userId = req.session.user

    const order = await Order.findById(orderId)
      const cart=await Cart.findOne({userId}).populate('items.productId');
      const coupons=await couponSchema.find({isActive:true})
           

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const appliedCouponDiscount = order.couponDiscount || 0;

    const shippingFee = order.totalPrice > 250 ? 0 : 40;

    console.log('Order:', order);
    console.log('Applied Coupon Discount:', appliedCouponDiscount);

    res.render('user/orderSuccess', { order,
      cart,coupons,
      shippingFee, 
      appliedCouponDiscount 
     })
  }
  catch (err) {
    console.error(`error from load order success : ${err}`);
    return res.status(500).send('Server Error');
  }
};




const viewOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId).populate('products.productId').exec();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

  
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};




const returnOrder = async (req, res) => {

  const {reason }= req.body;
  const { orderId } = req.params;

  try {
   
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

     
  
    order.request.requested = true;
    order.request.reason= reason
    await order.save();

  

    res.status(200).json({
      success: true,
      message: "Return request submitted successfully. Refund processed to your wallet.",
    });
  
  } catch (error) {
    console.error(`Error in returnOrder: ${error}`);
    res.status(500).json({ message: "An error occurred while processing the return." });
  }
};

const retryPayment=async(req,res)=>{

  
  const {orderId} = req.body

  const order = await orderModel.findByIdAndUpdate(orderId,{
    $set:{paymentStatus:'Success'}
  })

  console.log(orderId);
  
  
  res.status(200).json({success:true})
 
}



const downloadInvoice = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId).populate('userId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Invoice is only available for delivered orders.' });
    }

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="order-${orderId}.pdf"`);

    doc.pipe(res);

    doc.fontSize(24).text('Wrist Vibe Invoice', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14);
    doc.text(`Order ID: ${orderId}`);
    doc.text(`Customer: ${order.customer.userName}`);
    doc.text(`Email: ${order.customer.email}`);
    doc.text(
      `Address: ${order.customer.address.houseNo}, ${order.customer.address.area}, ${order.customer.address.town}, ${order.customer.address.state} - ${order.customer.address.pincode}`
    );
    doc.text(`Order Date: ${order.orderDate.toDateString()}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.moveDown();

    doc.fontSize(16).text('Products:', { underline: true });
    doc.moveDown();

    doc.fontSize(14).text(
      `No.  Product Name                Qty     Price     Total`,
      { align: 'left' }
    );
    doc.text(`----------------------------------------------------------`);
    doc.moveDown(0.5);

    order.products.forEach((product, index) => {
      const productLine = `${(index + 1).toString().padEnd(5)} ${product.productName.padEnd(25)} ${product.quantity
        .toString()
        .padEnd(8)} ₹${product.price.toString().padEnd(9)} ₹${product.total}`;
      doc.text(productLine);
    });
    doc.moveDown();

    doc.text(`----------------------------------------------------------`);
    doc.text(`Total Price: ₹${order.totalPrice}`, { align: 'right' });
    if (order.couponDiscount) {
      doc.text(`Discount: ₹${order.couponDiscount}`, { align: 'right' });
    }
    doc.text(`Final Price: ₹${order.totalPrice - (order.couponDiscount || 0)}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(14).text('Thank you for shopping with Wrist Vibe!', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};




module.exports = {
  placeOrder, getOrders, cancelOrder, loadSuccess, returnOrder, viewOrder,  downloadInvoice ,retryPayment
}