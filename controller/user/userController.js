const User = require('../../model/userModel')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const walletSchema=require('../../model/walletModel')
require('dotenv').config()


const loadLogin = async (req, res) => {
    res.render('user/login',{error:null})
       
}

const loginpage = async (req, res) => {
    const { email, password } = req.body;
    try {
       
        const user = await User.findOne({ email });
        if (user) {
           
            if (user.isBlocked) {
               
                return res.status(401).render('user/login', { error: 'Your account has been blocked.' });
            }
         
            const isMatch = await bcrypt.compare(password, user.password);
            console.log(isMatch);

            if (isMatch) {
               
                req.session.user = user._id;
                return res.redirect('/home');
            }
        }
        res.status(401).render('user/login', { error: 'Invalid email or password' });
    } catch (err) {
        console.error(err);
        res.status(500).render('user/login', { error: 'Something went wrong. Please try again.' });
    }
};

const loadRegister = async (req, res) => {
    req.session.refferalCode=req.query.refferalCode
    res.render('user/register')
}

const loadOtp = async (req, res) => {
    res.render('user/registerOTP')
}



const registerUser = async (req, res) => {
    const { name, phone, email, password, confirm_password } = req.body;
    console.log(req.body);

    try {

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('Email already exists.');
        }


        if (password !== confirm_password) {
            return res.status(400).send('Passwords do not match.');
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

        req.session.tempUserData = { name, phone, email, password };
        req.session.otp = generatedOtp;
        res.status(200).json({ message: "OTP sent successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during registration.');
    }
};

const verifyOtp = async (req, res) => {
    
    const { otp } = req.body;
    console.log("Received OTP from user:", otp);
    console.log("Stored OTP in session:", req.session.otp);

    if (otp === req.session.otp) {
        const { name, phone, email, password } = req.session.tempUserData;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ name, phone, email, password: hashedPassword });
            await newUser.save();      
            req.session.otp = null;
            req.session.tempUserData = null;
            req.session.user = newUser._id 

            if(req.session.refferalCode){
                const user=req.session.refferalCode

                const owner = await User.findById(user);
                 
                if(owner){
                    const userId=owner._id
                    await walletSchema.findOneAndUpdate(
                        { userId },
                        {
                          $inc: { balance: 200 },
                          $push: {
                            transactions: {
                              type: "credit",
                              amount: 200,
                              description: "Referral Bonus",
                              date: new Date(),
                            },
                          },
                        },
                        { new: true, upsert: true }
                      );
                }
            }
            res.redirect('/home')
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to save user details.' });
        }
    } else {
        res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }
};


const resendOtp = async (req, res) => {
    try {
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
        console.log("resended", generatedOtp);

        req.session.otp = generatedOtp;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS,
            },
        });

        console.log(req.session.tempUserData);
        const { name, phone, email, password } = req.session.tempUserData


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

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Something went wrong. Please try again.');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login'); 
    });
};



module.exports = {
    loadLogin, loadRegister, registerUser, loadOtp,
    verifyOtp, resendOtp, loginpage,logout,
}