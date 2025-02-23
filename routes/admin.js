const express=require('express')
const router = express.Router()

const adminAuth = require('../middlewares/adminAuth.js')

const adminController = require('../controllers/admin/adminController.js')
const customerController = require('../controllers/admin/customerController.js')
const brandsController = require('../controllers/admin/brandsController.js')
const categoryController =require('../controllers/admin/categoryController.js')
const productController = require('../controllers/admin/productController.js')
const productSizeController = require('../controllers/admin/productSizeController.js')

const upload = require('../helpers/multer.js')
const multer = require('multer')






router.get('/login',adminAuth.isAdminLoggedin,adminController.loadLogin)
router.post('/login',adminController.formValidate)
router.get('/dashboard',adminAuth.isAdminLoggedOut,adminController.loadDashboard)
router.get('/forgetPassword',adminController.forgetPassword) 
router.post('/findAdmin',adminController.sentOtp)   
router.get('/logout',adminController.logout)


router.get('/customers',customerController.viewCustomers)
router.get('/blockCustomer',customerController.blockCustomer)
router.get('/unblockcustomer',customerController.unblockCustomer)


router.get('/brands',brandsController.viewBrands)
router.post('/addBrand',upload.single('brandImage'),brandsController.addBrand)


router.get('/categories',categoryController.loadCategories)
router.post('/addCategory',categoryController.addCategory)
router.post('/updateCategory',categoryController.editCategory)

router.get('/products',productController.viewProducts)
router.get('/addProduct',productController.viewAddProductPage)
router.post ('/addProduct',upload.array("productImages",4),productController.addProduct)
router.get('/editProduct/:productId',productController.viewEditProduct)

router.get('/productSizes',productSizeController.viewCubeSizes)
router.post('/addSize',productSizeController.addSize)




//     (req,res)=>{
//     res.render('admin/login')
// })

// router.get('/dashboard',(req,res)=>{
//     res.render('admin/dashboard')
// })





module.exports=router