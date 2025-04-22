const express=require('express')
const router = express.Router()

const adminAuth = require('../middlewares/adminAuth.js')

const adminController = require('../controllers/admin/adminController.js')
const customerController = require('../controllers/admin/customerController.js')
const brandsController = require('../controllers/admin/brandsController.js')
const categoryController =require('../controllers/admin/categoryController.js')
const productController = require('../controllers/admin/productController.js')
const productSizeController = require('../controllers/admin/productSizeController.js')
const orderController = require('../controllers/admin/orderController.js')
const couponController = require('../controllers/admin/couponController.js')
const salesReportHelper = require('../helpers/salesReport.js')
const walletController = require('../controllers/admin/walletController.js')
const dashboardContoller = require('../controllers/admin/dashBoardController.js')
const upload = require('../helpers/multer.js')
const multer = require('multer')

router.get('/logout',adminController.logout)
router.get('/forgetPassword',adminController.forgetPassword) 

router.get('/login',adminAuth.isAdminLoggedin,adminController.loadLogin)
router.post('/login',adminAuth.isAdminLoggedin,adminController.formValidate)

router.use(adminAuth.isAdminLoggedOut)// routes below this apply this condition
router.get('/dashboard',dashboardContoller.viewDashboard)


router.get('/customers',customerController.viewCustomers)
router.get('/blockCustomer',customerController.blockCustomer)
router.get('/unblockcustomer',customerController.unblockCustomer)
router.post('/searchCustomers',customerController.searchCustomer)

router.get('/brands',brandsController.viewBrands)
router.post('/addBrand',upload.single('brandImage'),brandsController.addBrand)


router.get('/categories',categoryController.loadCategories)
router.post('/addCategory',categoryController.addCategory)
router.post('/updateCategory',categoryController.editCategory)

router.get('/products',productController.viewProducts)
router.get('/addProduct',productController.viewAddProductPage)
router.post ('/addProduct',upload.array("productImages",4),productController.addProduct)
router.get('/editProduct/:productId',productController.viewEditProduct) //added query error handler
router.post('/editProduct',upload.array('productImages',4),productController.editProduct)
router.post('/removeProductImage',productController.removeProductImage)
router.patch('/changeStatus-Product/:id',productController.changeStatus) //added query error handling

router.get('/productSizes',productSizeController.viewCubeSizes)
router.post('/addSize',productSizeController.addSize)
router.delete('/deleteProduct/:id',productController.deleteProduct) // added query error handling


router.get('/orders',orderController.viewOrders)
router.get('/orderDetail/:orderId',orderController.orderDetail) //error done
router.put('/change-order-status/:orderId',orderController.changeOrderStatus) //error done
router.get('/order/invoice/:orderId',orderController.createInvoice) //error done

router.post('/approve-return',orderController.approveReturnRequest)
router.post('/cancel-return',orderController.rejectReturnRequest)
router.get('/Sales-Report',orderController.generateReport)

router.get('/coupons',couponController.viewCouponPage)
router.post('/addCoupon',couponController.addNewCoupon)
router.get('/wallet',walletController.viewWallet)
router.get('/page-not-found',adminController.viewErrorPage)
router.get('/internal-server-error',adminController.viewServerErrorPage)

router.get('/salesReport',salesReportHelper.productsSold)

module.exports=router