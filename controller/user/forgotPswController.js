const User=require('../../model/userModel')
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')

const resetPassword = async(req,res)=>{

    const { email } = req.body;

    try {
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('No user found with this email.');
        }
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString(); 
        console.log('generated otp:', generatedOtp);


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your OTP for Wrist Vibe',
            text: `Your OTP is: ${generatedOtp}`,
        };

        await transporter.sendMail(mailOptions);

        req.session.email = {  email };
        req.session.otp1 = generatedOtp;
        console.log("Stored OTP in session:34", req.session.otp1);
        res.render('user/passwordOTP');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during registration.');
    }

}

        const verifyPasswordOTP = async (req, res) => {
            
            const { otp } = req.body;
            console.log(otp,"rxrxrdcgcgfc");
            
            console.log("Received OTP from user:", otp);
            console.log("Stored OTP in session:", req.session.otp1);

            if (otp === req.session.otp1) {
            

                try {
                    
                    req.session.otp1 = null;
                    res.render('user/changePassword')
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: 'Failed to save user details.' });
                }
            } else {
                res.status(400).json({ message: 'Invalid OTP. Please try again.' });
            }
        };


        const passwordChecks= async (req, res) => {
           const {email}= req.session.email 
            const {  newpassword, confirmpassword } = req.body;
            console.log('lkjhf',email,newpassword,confirmpassword);
            
          
            try {
             
              if (newpassword !== confirmpassword) {
                return res.status(400).json({ message: 'Passwords do not match!' });
              }
          
             
              const user = await User.findOne({ email });
              if (!user) {
                return res.status(404).json({ message: 'User not found!' });
              }
              
              const hashedPassword = await bcrypt.hash(newpassword, 10);
            
              user.password = hashedPassword; 
              await user.save();
              res.redirect('/login'); 
          
            } catch (error) {
              console.error(error);
              res.status(500).json({ message: 'Failed to reset password!' });
            }
          };


const resendPasswordOtp = async (req, res) => {
    try {
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
        console.log("resendedoyfudy", generatedOtp);

        req.session.otp1 = generatedOtp;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS,
            },
        });

        console.log('heloooooooooooooooo',req.session.email);
        const { email } = req.session.email


        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Resend OTP for Wrist Vibe',
            text: `Your OTP is: ${generatedOtp}`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send('OTP has been resent to your email.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to resend OTP.');
    }
};


const changePassword=async(req,res)=>{
    res.render('user/changePassword')
}
    

const forgotPassword=async(req,res)=>{
res.render('user/forgotPassword')
}



module.exports={
    forgotPassword,resetPassword,verifyPasswordOTP,
    changePassword,resendPasswordOtp,passwordChecks
}