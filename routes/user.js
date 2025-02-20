const express = require('express')
const router = express.Router()
const userController= require('../controllers/user/userController')
const passport=require('passport')

router.get('/home',userController.loadHome)
router.get('/login',userController.userLogin)
router.get('/pagenotfound',userController.errorPage)
router.get('/signup',userController.signUp)
router.get('/about',userController.aboutPage)


router.post('/signin',userController.signIn)
router.post('/signup',userController.createUser)
router.get('/profile')
router.get('/google/login',passport.authenticate('google',{ scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/login'}),
    //  (req,res)=>{  res.redirect('/profile') }
    userController.userProfile)
router.get('/profile',userController.loadProfile
   // (req,res)=>{    res.render(`users/profile`)}
   )
router.get('/logout',userController.logout
    
)
router.post('/send-otp',userController.sendOTPtoEmail)
router.post('/verify-otp',userController.verifyOTP)
router.post('/resend-otp',userController.sendOTPtoEmail)

router.get('/products',userController.showProducts)
router.get('/sentOTP',userController.generateOTP)
module.exports=router