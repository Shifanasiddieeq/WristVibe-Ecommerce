const express = require('express')
const router = express.Router()
const login = require('../controller/admin/login')

const Adminsession = require('../middleware/adminAuth')
const user = require('../controller/admin/user')

const Admin = require('../model/adminModel');
const categoryController = require('../controller/admin/categoryController');
const orderManagement = require('../controller/admin/OrderManagement');
const productController = require('../controller/admin/productController');
const couponController = require('../controller/admin/couponController')
const offerController = require('../controller/admin/offerController')
const salesController = require('../controller/admin/salesController')
const dashboardController=require('../controller/admin/dashboardController')

const { upload } = require('../middleware/imageUpload');
const cartModel = require('../model/cartModel')




router.get('/categories', Adminsession.checkSession, categoryController.loadCategories);
router.post('/categories', Adminsession.checkSession, categoryController.addCategory);
router.post('/categories/:id/edit', Adminsession.checkSession, categoryController.editCategory);
router.post('/categories/:id/toggle-status', Adminsession.checkSession, categoryController.categoryStatus);

router.get('/products', Adminsession.checkSession, productController.loadProducts);

router.post('/products', Adminsession.checkSession, upload.array('images', 3), productController.addProduct);

router.get('/products/:id', Adminsession.checkSession, productController.getProductDetails);

router.post('/products/:id/list-unlist', Adminsession.checkSession, productController.listUnlistProduct);

router.get('/editproduct/:id', Adminsession.checkSession, productController.loadEditProduct);
router.post('/editproduct/:id', Adminsession.checkSession, upload.any(), productController.updateProduct);

router.get('/addproduct', Adminsession.checkSession, productController.loadAddproduct);


router.get('/login', Adminsession.isLogin, login.loadLogin)
router.post('/login', login.login)

router.get('/admin-order', Adminsession.checkSession, orderManagement.getOrders)
router.post('/adminOrder/:orderId', orderManagement.updateOrderStatus);
router.get('/orderDetails/:orderId', orderManagement.viewOrderDetails);


router.post('/logout', login.logout)

router.get('/users', Adminsession.checkSession, user.userpage)


router.patch('/users/:id/status', user.userblock);

router.get('/coupon', Adminsession.checkSession, couponController.loadCoupon)
router.post('/addCoupon', couponController.addCoupon)

router.patch('/coupon/edit/:id', couponController.editCoupon);
router.delete('/coupon/delete/:couponId', couponController.deleteCoupon)

router.get('/salesreport', Adminsession.checkSession, salesController.loadSales)

router.post('/sales-report', salesController.salesreport)



router.get('/offer', Adminsession.checkSession, offerController.loadOffer)
router.post('/addoffer', offerController.addOffer)
router.put('/editOffer/:offerId',offerController.editOffer)
router.put('/deleteOffers/:offerId',offerController.offerStatus);

router.post('/approvReturnOrder',orderManagement.approveReturnOrder)

router.post('/sales-report/download/:format',salesController.downloadSalesreport)



router.get('/dashboard', Adminsession.checkSession,dashboardController.loadDashboard)
router.post('/dashboard/filter',dashboardController.filter)
router.post('/changeFilter',dashboardController.changeFilter)


module.exports = router