const express = require('express')
const router = express.Router()
const userContoller = require('../controller/user/userController')
const homeController = require('../controller/user/homeController')
const shopController = require('../controller/user/shopController')
const authController = require('../config/passportSetup')
const userSession = require('../middleware/userAuth')
const { checkSession } = require('../middleware/adminAuth')

const passwordController = require('../controller/user/forgotPswController')
const accountController = require('../controller/user/accountController')
const addressController = require('../controller/user/addressController')
const cartController = require('../controller/user/cartController')
const checkoutController = require('../controller/user/checkoutController')
const orderController = require('../controller/user/orderController')
const razorpayController = require('../controller/user/razorpayController')
const couponController = require('../controller/user/couponUserController')
const wishlistController = require('../controller/user/wishlistController')
const walletController = require('../controller/user/walletController')

router.get('/login', userSession.isLogin, userContoller.loadLogin)
router.post('/login', userContoller.loginpage)
router.get('/register', userSession.isLogin, userContoller.loadRegister)
router.post('/register', userContoller.registerUser)
router.get('/registerOTP', userSession.isLogin, userContoller.loadOtp)

router.get('/home', userSession.checkSession, homeController.loadHome)
router.get('/shop', userSession.checkSession, shopController.loadShop)
router.get('/productDetails/:id',userSession.checkSession,shopController.productDetails)


router.post('/verify-otp', userContoller.verifyOtp)

router.post('/user/resend-otp', userContoller.resendOtp)
router.get('/logout', userContoller.logout);


router.get('/forgotPassword', passwordController.forgotPassword)
router.post('/reset-password', passwordController.resetPassword)
router.post('/verifyPassword', passwordController.verifyPasswordOTP)
router.get('/changePassword', passwordController.changePassword)
router.post('/resendPasswordOTP', passwordController.resendPasswordOtp)
router.post('/passwordChecks', passwordController.passwordChecks)

router.post('/update-profile', accountController.updateProfile)
router.post('/profile-password', accountController.updateProfilePassword)

router.get('/account', userSession.checkSession, accountController.loadProfile)
router.get('/address', userSession.checkSession, addressController.loadAddress)
router.get('/add-address', userSession.checkSession, addressController.addAddress)
router.post('/save-address', addressController.saveAddres)

router.get('/edit-address/:id', userSession.checkSession, addressController.editAddress)
router.post('/edit-address/:id', addressController.saveEditedAddress)
router.post('/delete-address/:id', addressController.deleteAddress)

router.get('/cart', userSession.checkSession, cartController.loadCart)
router.post('/addtocart', cartController.addtoCart)
router.post('/updateQuantity', cartController.updateQuantity);
router.delete('/removeFromCart', cartController.removeItemFromCart);


router.get('/checkout',userSession.checkSession,checkoutController.loadCheckout)

router.post('/place-order',orderController.placeOrder)

router.get('/orders', userSession.checkSession, orderController.getOrders)
router.get('/orders/:orderId',userSession.checkSession, orderController.viewOrder);
router.put('/orders/cancel/:orderId', orderController.cancelOrder);
router.put('/orders/return/:orderId', orderController.returnOrder);

router.get('/orderSuccess/:orderId', userSession.checkSession, orderController.loadSuccess);
router.post('/apply-coupon', couponController.applyCoupon)
router.post('/remove-coupon', couponController.removeCoupon)



router.post('/checkout/razorpay', razorpayController.payment)
router.post('/verify-payment', razorpayController.verifyPayment)

router.get('/wishlist', userSession.checkSession, wishlistController.loadWishlist)
router.post('/addtowishlist', wishlistController.addWishlist)

router.post('/wishlist/remove', wishlistController.removeWishlist)

router.get('/wallet', userSession.checkSession, walletController.loadWallet)

router.get('/invoice/:orderId', orderController.downloadInvoice);
router.post('/retry-payment',orderController.retryPayment)


router.get('/proceedToCheckout',userSession.checkSession,cartController.proceedtoCheckout)
router.get('/aboutus',userSession.checkSession,homeController.loadAbout)
router.get('/contactus',userSession.checkSession,homeController.loadContact)
module.exports = router

