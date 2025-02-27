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
router.post('/login',adminAuth.isAdminLoggedin,adminController.formValidate)
router.get('/dashboard',adminAuth.isAdminLoggedOut,adminController.loadDashboard)
router.get('/forgetPassword',adminController.forgetPassword) 
//router.post('/findAdmin',adminController.sentOtp)   
router.get('/logout',adminController.logout)


router.get('/customers',adminAuth.isAdminLoggedOut,customerController.viewCustomers)
router.get('/blockCustomer',adminAuth.isAdminLoggedOut,customerController.blockCustomer)
router.get('/unblockcustomer',adminAuth.isAdminLoggedOut,customerController.unblockCustomer)
router.post('/searchCustomers',adminAuth.isAdminLoggedOut,customerController.searchCustomer)

router.get('/brands',adminAuth.isAdminLoggedOut,brandsController.viewBrands)
router.post('/addBrand',adminAuth.isAdminLoggedOut,upload.single('brandImage'),brandsController.addBrand)


router.get('/categories',adminAuth.isAdminLoggedOut,categoryController.loadCategories)
router.post('/addCategory',adminAuth.isAdminLoggedOut,categoryController.addCategory)
router.post('/updateCategory',adminAuth.isAdminLoggedOut,categoryController.editCategory)

router.get('/products',adminAuth.isAdminLoggedOut,productController.viewProducts)
router.get('/addProduct',adminAuth.isAdminLoggedOut,productController.viewAddProductPage)
router.post ('/addProduct',adminAuth.isAdminLoggedOut,upload.array("productImages",4),productController.addProduct)
router.get('/editProduct/:productId',adminAuth.isAdminLoggedOut,productController.viewEditProduct)
router.post('/editProduct',adminAuth.isAdminLoggedOut,upload.array('productImages',4),productController.editProduct)
router.patch('/changeStatus-Product/:id',adminAuth.isAdminLoggedOut,productController.changeStatus)

router.get('/productSizes',adminAuth.isAdminLoggedOut,productSizeController.viewCubeSizes)
router.post('/addSize',adminAuth.isAdminLoggedOut,productSizeController.addSize)
router.delete('/deleteProduct/:id',adminAuth.isAdminLoggedOut,productController.deleteProduct)





//     (req,res)=>{
//     res.render('admin/login')
// })

// router.get('/dashboard',(req,res)=>{
//     res.render('admin/dashboard')
// })





module.exports=router