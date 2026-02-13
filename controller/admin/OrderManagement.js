const Order = require('../../model/orderModel')
const walletSchema = require('../../model/walletModel')

const Product = require('../../model/productModel');
const User = require('../../model/userModel');

const getOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const limit = 6; 
  const skip = (page - 1) * limit; 


  try {
  
    const userId = req.session.user;

    const user = await User.findById(userId);
    const totalOrders = await Order.countDocuments();

    const orders = await Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalPages = Math.ceil(totalOrders / limit);

    res.render('admin/orderadmin', {
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


const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { status } = req.body;
    
    
    const order = await Order.findById(orderId);
    console.log(order);

    if (!order) {
      return res.status(404).send('Order not found');
    }

  
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      for (const product of order.products) {
        await Product.findByIdAndUpdate(
          product.productId,
          { $inc: { stockCount: product.quantity } },
          { new: true }
        );
      }
    }
    
    if(status == 'Delivered'){
      order.paymentStatus = 'Paid'
    }

    order.status = status;
    await order.save();

    res.status(200).json({success:true,status})
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const approveReturnOrder = async(req,res)=>{

  const { orderId } = req.body;

    try {
   
        const order = await Order.findOneAndUpdate(
            { _id: orderId },
            {
              $set:{
                status:'Returned',
                'request.requested': false, 
                'request.approve': true   
              }
            },
            { new: true } 
        );

        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        
        console.log('jjjjjjjjjjj');
        
        for (const product of order.products) {
          const productDoc = await Product.findById(product.productId);
          console.log(productDoc);
          
          if (productDoc) {
            productDoc.stockCount += product.quantity;
            await productDoc.save();
          }
        }

        //wallet
        const userId = req.session.user; 
    const refundAmount = order.totalPrice ;

    let wallet = await walletSchema.findOne({ userId });
    if (wallet) {
   
      wallet.balance += refundAmount;
      wallet.transactions.push({
        type: 'credit',
        amount: refundAmount,
        description: `Refund for returned order: ${orderId.slice(-15)}`,
      });
      await wallet.save();
    } else {
  
      wallet = await walletSchema.create({
        userId,
        balance: refundAmount,
        transactions: [
          {
            type: 'credit',
            amount: refundAmount,
            description: `Refund for returned order: ${orderId.slice(-15)}`,
          },
        ],
      });
    }

        
        return res.status(200).json({
            success: true,
            message: 'Order approved successfully',
            order
        });

        
    } catch (error) {
        console.error('Error approving order:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing the request'
        });
    }
}

 
const viewOrderDetails = async (req, res) => {
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



module.exports = {
  getOrders,
  updateOrderStatus,
  approveReturnOrder,
  viewOrderDetails

 
};

