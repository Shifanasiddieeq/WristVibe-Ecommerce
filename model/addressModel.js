const mongoose = require('mongoose')
const addressSchema= new mongoose.Schema({
    houseNo:{
        type:String,
        required:true},
    area:{
        type:String,
        required:true},

    landmark:{  type:String,
        required:true},

    town:{  type:String,
        required:true},

    pincode:{
        type:Number,
        required:true},
        
    state:{  type:String,
        required:true,},
    userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required: true},

})


module.exports=mongoose.model('Address',addressSchema)