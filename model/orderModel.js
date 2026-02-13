const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required: true},
    customer: {
        userName: { type: String, required: true },
        email: { type: String, required: true },
        address: {
            houseNo: { type: String, required: true },
            area: { type: String, required: true },
            landmark: { type: String, required: true },
            town: { type: String, required: true },
            pincode: { type: String, required: true } ,
            state: { type: String, required: true } ,
        }
    },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        total: { type: Number, required: true }, 
        image: { type: String, required: true },
      
    }],
    status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled' , 'Returned'], default: 'Pending' ,required: true },
    totalPrice: {
        type: Number,
        required: true 
    },
    couponDiscount :{
        type: Number,
    },
    paymentMethod: {
        type: String,
        required: true 
    },
    paymentStatus: {
        type : String,
        enum : ['Paid', 'Failed', 'Pending','Success'],
        required : true,
    }, 
    orderDate: {
        type: Date,
        default: Date.now     
    },
    request:{
        requested:{type:Boolean , default:false},
        reason:{type:String},
        approve:{type:Boolean,default:false}

    },
    offerDiscount: { type: Number, required: true }
   },{ timestamps: true });


module.exports = mongoose.model('Order', orderSchema);