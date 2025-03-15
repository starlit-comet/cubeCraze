const express = require('express')
const router = express.Router()
const userController= require('../controllers/user/userController')
const profileController = require('../controllers/user/profileController')
const productController = require('../controllers/user/productController')
const shopController = require('../controllers/user/shopController')
const addressController = require('../controllers/user/addressController')
const cartController = require('../controllers/user/cartController')
const orderController = require('../controllers/user/orderController')
const userSchema = require('../models/userSchema')

const userAuth = require('../middlewares/userAuth')
const passport=require('passport')

async function findUser(id){
    const user= await userSchema.findById(id)
    return user
}

router.use((req,res,next)=>{
    res.locals.searchKeyWord=''
    res.locals.minPrice=500
    res.locals.maxPrice=7500
    res.locals.cart={}
    if(req.session._id) res.locals.user=findUser(req.session._id)
       // console.log('locals user set')
    next()
})

router.get('/pagenotfound',userController.errorPage)

router.get('/login',userAuth.isUserLoggedin,userController.userLogin)
router.get('/signup',userAuth.isUserLoggedin,userController.signUp)
router.get('/about',userController.aboutPage)
router.get('/verifyOTP',userController.viewOTPpage)
router.get('/get-otp-timer',userController.getOTPTimer)
router.get('/forgotPassword',userController.viewForgotPassword)

router.post('/signin',userController.signIn)
router.post('/signup',userController.createUser)

router.get('/setPassword',userController.viewSetPassword)
router.post('/setPassword',userController.updatePassword)
router.post('/forgetPassword',userController.findUserAccount)

router.get('/profile',userAuth.isUserLoggedOut,profileController.viewProfilePage)
router.get('/google/login',passport.authenticate('google',{ scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/login'}), userController.userProfile)
router.get('/googleProfile',userController.googleUserProfile)
router.get('/logout',userController.logout)
router.post('/send-otp',userController.sendOTPtoEmail)
router.post('/verify-otp',userController.verifyOTP)
router.post('/resend-otp',userController.sendOTPtoEmail)

router.get('/add-new-Address',userAuth.isUserLoggedOut,addressController.viewAddressPage)
router.post('/addAddress',userAuth.isUserLoggedOut,addressController.addAddress)
router.get('/editAddress/:_id',userAuth.isUserLoggedOut,addressController.viewEditAddress)
router.post('/editAddress',userAuth.isUserLoggedOut,addressController.editAddress)
router.delete('/deleteAddress',userAuth.isUserLoggedOut,addressController.deleteAddress)

router.get('/viewProduct/:productId',productController.viewProduct)

router.get('/shop',shopController.viewShop)
router.get('/home',shopController.loadHome)

router.get('/wishList',userAuth.isUserLoggedOut,productController.viewWishList)
router.post('/removeFromWishList',userAuth.isUserLoggedOut,productController.removeFromWishList)
router.post('/addtoWishList',userAuth.isUserLoggedOut,productController.addtoWishList)

router.get('/cart',userAuth.isUserLoggedOut,cartController.viewCart)
router.post('/addToCart',userAuth.isUserLoggedOut ,cartController.addToCart)
router.post('/removeFromCart',userAuth.isUserLoggedOut,cartController.removeFromCart)
router.post('/increaseQuantity',userAuth.isUserLoggedOut,productController.increaseQuantity)
router.post('/decreaseQuantity',userAuth.isUserLoggedOut,productController.decreaseQuantity)

router.get('/cartCheckout',userAuth.isUserLoggedOut,cartController.checkout)
router.get('/cartCheck',userAuth.isUserLoggedOut,cartController.cartCheck)

// router.get('/orderList',userAuth.isUserLoggedOut,cartController.viewOrderList)
router.post('/createOrder',userAuth.isUserLoggedOut,orderController.createOrder)
router.get('/orderList',userAuth.isUserLoggedOut,orderController.viewOrders)
router.get('/viewOrder/:orderId',userAuth.isUserLoggedOut,orderController.orderDetail)
router.get('/trackOrder/:orderId',userAuth.isUserLoggedOut,orderController.orderTrack)

//print invoice
router.get('/order/invoice/:orderId',orderController.createInvoice)
//delete order
router.patch('/orders/cancel/:orderId',orderController.cancelOrder)

// router.get('/sentOTP',userController.generateOTP)
module.exports=router