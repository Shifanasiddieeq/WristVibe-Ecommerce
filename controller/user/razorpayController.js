const Razorpay = require('razorpay')
const crypto = require('crypto')


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const payment = async (req, res) => {


  const { totalPrice } = req.body;
  const amount = totalPrice

  try {
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Math.random()}`,
    }

    const order = await razorpay.orders.create(options);
    console.log('genarated-order', order)

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong!', error });
  }
}


const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
   
    if (generated_signature === razorpay_signature) {
      res.json({ status: 'Payment Verified Successfully' });
    } else {
      res.status(400).json({ message: 'Invalid Signature' });
    }
  } catch (error) {
    console.log(`error from verify payment : ${error}`);

  }
}





module.exports = {
  payment, verifyPayment
}