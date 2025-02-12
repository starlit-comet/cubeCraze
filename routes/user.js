const express = require('express')
const router = express.Router()
const userController= require('../controllers/user/userController')


router.get('/home',userController.loadHome)
router.get('/login',userController.userLogin)
router.get('/pagenotfound',userController.errorPage)
router.get('/signup',userController.signUp)

module.exports=router