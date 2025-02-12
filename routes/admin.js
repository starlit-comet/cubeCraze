const express=require('express')
const router = express.Router()

const adminController = require('../controllers/admin/signIn.js')



router.get('/login',adminController.loadLogin)
router.post('/login',adminController.formValidate)
router.get('/dashboard',adminController.loadDashboard)
router.get('/forgetPassword',adminController.forgetPassword) 
router.post('/findAdmin',adminController.sentOtp)   

    
//     (req,res)=>{
//     res.render('admin/login')
// })

// router.get('/dashboard',(req,res)=>{
//     res.render('admin/dashboard')
// })





module.exports=router