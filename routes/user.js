const express = require('express')
const router = express.Router()
const userController= require('../controllers/user/userController')
const profileController = require('../controllers/user/profileController')
const productController = require('../controllers/user/productController')
const shopController = require('../controllers/user/shopController')
const addressController = require('../controllers/user/addressController')
const cartController = require('../controllers/user/cartController')
const orderController = require('../controllers/user/orderController')
const referralController = require('../controllers/user/referralController')

const userSchema = require('../models/userSchema')


const upload = require('../helpers/multer')
const userAuth = require('../middlewares/userAuth')
const passport=require('passport')

const userValidator = async (req,res,next)=>{
    const user = req.session.user
   // console.log(user,'validator')
    next()
}

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
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/login?error=userBlocked'}), userController.userProfile)
router.get('/googleProfile',userController.googleUserProfile)
router.get('/logout',userController.logout)
router.post('/send-otp',userController.sendOTPtoEmail)
router.post('/verify-otp',userController.verifyOTP)
router.post('/resend-otp',userController.sendOTPtoEmail)

router.get('/add-new-Address',userAuth.isUserLoggedOut,addressController.viewAddressPage)
router.post('/addAddress',userAuth.isUserLoggedOut,addressController.addAddress)
router.get('/editAddress/:_id',userAuth.isUserLoggedOut,addressController.viewEditAddress)//error done
router.post('/editAddress',userAuth.isUserLoggedOut,addressController.editAddress)
router.delete('/deleteAddress',userAuth.isUserLoggedOut,addressController.deleteAddress)

router.post('/updatePassword',userAuth.isUserLoggedOut,userController.editPassword)
router.post('/updateAccount',userAuth.isUserLoggedOut,userController.updateAccount)
router.post('/addProfilePicture',upload.single('profileImage'),userController.addUserImage)
router.post('/editUserDetails',userAuth.isUserLoggedOut,userController.editUserDetails)

router.get('/viewProduct/:productId',productController.viewProduct) //error done

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
router.post('/createOrder',userAuth.isUserLoggedOut,orderController.createOrder)  // cod orders
router.get('/orders',userAuth.isUserLoggedOut,orderController.viewOrders)
router.get('/viewOrder/:orderId',userAuth.isUserLoggedOut,orderController.orderDetail)  //error done
router.get('/trackOrder/:orderId',userAuth.isUserLoggedOut,orderController.orderTrack)  //error done

// Razorpay payments route
router.post('/create-razorpay-order',userAuth.isUserLoggedOut,orderController.createOrderRazorpay)
router.post('/verify-razorpay-payment',userAuth.isUserLoggedOut,orderController.verifyRazorpayPayment)
router.get('/payment-failed', userAuth.isUserLoggedOut, (req, res) => {
    res.render('users/paymentFailed', { title: 'Payment Failed' });
  });
  
//print invoice
router.get('/order/invoice/:orderId',orderController.createInvoice) 
//delete order
router.patch('/orders/cancel/:orderId',orderController.cancelOrder)
router.post('/orders/cancel-product/:orderId',orderController.cancelSingleProduct) //cancel a single product

router.post('/referFriend',referralController.sentEmail)

router.post('/request-product-return',orderController.requestProductReturn)

router.get('/cartAndWishlistData',productController.sendCartAndWishlistData)
// router.get('/sentOTP',userController.generateOTP)
module.exports=router