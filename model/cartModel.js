const mongoose = require('mongoose')

const cartSchema= new mongoose.Schema({
    items:[{
        productId:
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true
        },
        quantity:{
            type:Number,
            default:1
        },
        totalPrice:{
            type:Number,
            default:0
        },
        price:{
            type:Number,
            required:true
        }

        }],
userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
},
        
cartTotalPrice:{
    type:Number,
    required:true
}

})
    

module.exports=mongoose.model('Cart',cartSchema)