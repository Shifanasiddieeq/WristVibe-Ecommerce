const User = require('../../model/userModel')
const express = require('express');
const bcrypt = require('bcrypt');
const StatusCodes = require('../../utils/statusCode');
const router = express.Router();

const loadProfile = async(req,res)=>{

const userId = req.session.user
const user= await User.findById(userId)
res.render('user/account',{
        user
    })
}

const updateProfile = async(req,res)=>{
    try {
        const { name, email ,phone } = req.body;
    
        const updatedUser = await User.findOneAndUpdate(
            { email }, 
            { name,phone },  
           
            { new: true } 
        );

        res.redirect('/account'); 
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('An error occurred while updating the profile');
    }

}

 const updateProfilePassword=async(req,res)=>{

    try {
        const { currentPassword, newPassword} = req.body;
        console.log(currentPassword);
   
       
        const userId = req.session.user

        
        const user = await User.findById(userId);
        
        
        if (!user || !user.password) {
            return res.status(StatusCodes.NOT_FOUND).json('User not found');
        }
        console.log(userId);
        
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
         
            return res.status(400).json('current password is incorrect')
            
        }
        console.log(currentPassword, newPassword,userId);
    
        const hashedPassword = await bcrypt.hash(newPassword, 10);

       
        user.password = hashedPassword;
        await user.save();
        res.status(StatusCodes.OK).json({ message: 'Password changed successfully.' });
     
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('An error occurred while changing the password');
    }
}






module.exports={
    loadProfile,updateProfile,updateProfilePassword
}