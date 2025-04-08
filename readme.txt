-admin credentials
email: admin@gmail.com
password: Admin@123



git update commands
git add .
git commit -m 'add a msg here'
git push origin main



in my project, also give a senario about its usage, give the status codes which the sweet alert takes 
ChatGPT said:
Great! Here's a comprehensive list of HTTP status codes you can use in your project, along with scenarios and examples of how they might come into play. I’ll also touch on how you can use them with SweetAlert (usually via status-dependent messages).

✅ Common HTTP Status Codes to Use in Your Project
Code	Name	Usage Scenario
200	OK	✅ Success! Return this when a request completes successfully.
201	Created	When a new resource is created (e.g., a user registers, a product is added).
204	No Content	When the request was successful but there’s no content to return (e.g., delete success with no data).
400	Bad Request	Invalid data sent by the client (e.g., missing fields, invalid parameters).
401	Unauthorized	User isn't authenticated (e.g., missing/invalid token).
403	Forbidden	User is authenticated but doesn’t have permission (e.g., accessing an admin-only page).
404	Not Found	Requested resource not found (e.g., product ID doesn’t exist).
409	Conflict	Conflict in the request (e.g., duplicate data, like registering with an already-used email).
422	Unprocessable Entity	Semantic errors in data (e.g., password doesn’t meet complexity rules).
500	Internal Server Error	General server-side error (e.g., database is down, unknown exception).
503	Service Unavailable	Server is overloaded or down for maintenance.
✅ Scenarios + SweetAlert Examples
1. 200 OK
Scenario: Successfully updated user profile.
SweetAlert:
javascript
Copy code
Swal.fire('Success!', 'Your profile was updated.', 'success');
2. 201 Created
Scenario: New user successfully registered.
SweetAlert:
javascript
Copy code
Swal.fire('Welcome!', 'Your account has been created.', 'success');
3. 400 Bad Request
Scenario: User submits an empty form or invalid input.
SweetAlert:
javascript
Copy code
Swal.fire('Oops!', 'Please fill out all required fields.', 'warning');
4. 401 Unauthorized
Scenario: User tries to access a protected route without logging in.
SweetAlert:
javascript
Copy code
Swal.fire('Unauthorized!', 'Please log in to continue.', 'warning');
5. 403 Forbidden
Scenario: A normal user tries to delete something that only an admin can delete.
SweetAlert:
javascript
Copy code
Swal.fire('Access Denied!', 'You do not have permission to perform this action.', 'error');
6. 404 Not Found
Scenario: User clicks a link to a non-existent product.
SweetAlert:
javascript
Copy code
Swal.fire('Not Found!', 'The item you are looking for does not exist.', 'info');
7. 409 Conflict
Scenario: User tries to register with an email that already exists.
SweetAlert:
javascript
Copy code
Swal.fire('Conflict!', 'This email is already in use. Please use a different one.', 'warning');
8. 422 Unprocessable Entity
Scenario: Password doesn’t meet validation criteria (length, special character, etc.).
SweetAlert:
javascript
Copy code
Swal.fire('Validation Error!', 'Your password must be at least 8 characters long.', 'warning');
9. 500 Internal Server Error
Scenario: Something went wrong on the backend (e.g., database connection error).
SweetAlert:
javascript
Copy code
Swal.fire('Error!', 'Something went wrong. Please try again later.', 'error');
10. 503 Service Unavailable
Scenario: Server under maintenance.
SweetAlert:
javascript
Copy code
Swal.fire('Service Unavailable!', 'We are down for maintenance. Please check back soon.', 'info');
✅ SweetAlert Status Icons
SweetAlert2 uses types, which display different icons:

Type	Icon Purpose
success	Green tick, for successful actions.
error	Red cross, for errors or critical issues.
warning	Yellow warning triangle, for cautionary messages.
info	Blue circle with an "i", for general information.
question	Blue question mark, for confirmation dialogs.
▶️ Simple SweetAlert Template
javascript
Copy code
Swal.fire({
  title: 'Title Text',
  text: 'Your message here.',
  icon: 'success', // success | error | warning | info | question
});
✅ Quick Best Practices for Status Codes
2xx (Success): Things went well.
4xx (Client Error): User did something wrong (bad input, unauthorized access, etc.).
5xx (Server Error): Your backend/system did something wrong (internal error, downtime, etc.).
If you want, I can help you create a global error handler that maps status codes directly to SweetAlert messages in your project! Would that help streamline things for you?







You said:
**global error handler** t

give
ChatGPT said:
Absolutely! Here's a Global Error Handler that maps HTTP status codes to SweetAlert2 messages. You can plug this into your frontend project to handle API errors in one place—no repeating yourself all over your code.

✅ Global Error Handler Function
javascript
Copy code
// SweetAlert2 (you should have it loaded already)
import Swal from 'sweetalert2';

/**
 * Global error handler for API responses
 * @param {number} statusCode - The HTTP status code from the API response
 * @param {string} message - Optional custom message from the API
 */
function handleApiError(statusCode, message = '') {
  let title = '';
  let text = '';
  let icon = '';

  switch (statusCode) {
    case 400:
      title = 'Bad Request';
      text = message || 'The data you sent is invalid. Please check and try again.';
      icon = 'warning';
      break;

    case 401:
      title = 'Unauthorized';
      text = message || 'You are not logged in. Please log in to continue.';
      icon = 'warning';
      break;

    case 403:
      title = 'Forbidden';
      text = message || 'You do not have permission to do this action.';
      icon = 'error';
      break;

    case 404:
      title = 'Not Found';
      text = message || 'The requested resource could not be found.';
      icon = 'info';
      break;

    case 409:
      title = 'Conflict';
      text = message || 'There is a conflict with your request. Perhaps it already exists.';
      icon = 'warning';
      break;

    case 422:
      title = 'Validation Error';
      text = message || 'There was a problem with your input data.';
      icon = 'warning';
      break;

    case 500:
      title = 'Server Error';
      text = message || 'Something went wrong on the server. Please try again later.';
      icon = 'error';
      break;

    case 503:
      title = 'Service Unavailable';
      text = message || 'The service is currently unavailable. Please try again later.';
      icon = 'info';
      break;

    default:
      title = 'Unknown Error';
      text = message || 'An unexpected error occurred. Please try again.';
      icon = 'error';
      break;
  }

  // Show the alert
  Swal.fire({
    title,
    text,
    icon,
  });
}
✅ How to Use It
When you make an API request, and you catch an error (from fetch, axios, etc.), you can just call this handler:

▶️ Example with Axios
javascript
Copy code
axios.get('/api/user/profile')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    // Example usage: pass status and custom message (if any)
    const statusCode = error.response?.status;
    const message = error.response?.data?.message;

    handleApiError(statusCode, message);
  });
▶️ Example with Fetch
javascript
Copy code
fetch('/api/user/profile')
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw { status: response.status, message: data.message };
      });
    }
    return response.json();
  })
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    handleApiError(error.status, error.message);
  });
✅ Optional Enhancements
Auto Logout on 401 Unauthorized:
javascript
Copy code
if (statusCode === 401) {
  // clear auth tokens or session
  redirectToLogin();
}
Retry Logic for 503 Service Unavailable.
Custom Styling in SweetAlert2 (colors, buttons, etc.).
If you want, I can help you create a custom SweetAlert2 theme, or centralize API calls with automatic error handling! Want to build that out?




admin.js

=================


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
const upload = require('../helpers/multer.js')
const multer = require('multer')


router.get('/logout',adminController.logout)
router.get('/forgetPassword',adminController.forgetPassword) 

router.get('/login',adminAuth.isAdminLoggedin,adminController.loadLogin)
router.post('/login',adminAuth.isAdminLoggedin,adminController.formValidate)

router.use(adminAuth.isAdminLoggedOut)
router.get('/dashboard',adminAuth.isAdminLoggedOut,adminController.loadDashboard)
//router.post('/findAdmin',adminController.sentOtp)   


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
router.get('/editProduct/:productId',adminAuth.isAdminLoggedOut,productController.viewEditProduct) //added query error handler
router.post('/editProduct',adminAuth.isAdminLoggedOut,upload.array('productImages',4),productController.editProduct)
router.post('/removeProductImage',adminAuth.isAdminLoggedOut,productController.removeProductImage)
router.patch('/changeStatus-Product/:id',adminAuth.isAdminLoggedOut,productController.changeStatus) //added query error handling

router.get('/productSizes',adminAuth.isAdminLoggedOut,productSizeController.viewCubeSizes)
router.post('/addSize',adminAuth.isAdminLoggedOut,productSizeController.addSize)
router.delete('/deleteProduct/:id',adminAuth.isAdminLoggedOut,productController.deleteProduct) // added query error handling


router.get('/orders',adminAuth.isAdminLoggedOut,orderController.viewOrders)
router.get('/orderDetail/:orderId',adminAuth.isAdminLoggedOut,orderController.orderDetail) //error done
router.put('/change-order-status/:orderId',adminAuth.isAdminLoggedOut,orderController.changeOrderStatus) //error done
router.get('/order/invoice/:orderId',adminAuth.isAdminLoggedOut,orderController.createInvoice) //error done

router.post('/approve-return',adminAuth.isAdminLoggedOut,orderController.approveReturnRequest)
router.post('/cancel-return',adminAuth.isAdminLoggedOut,orderController.rejectReturnRequest)
router.get('/Sales-Report',adminAuth.isAdminLoggedOut,orderController.generateReport)

router.get('/coupons',adminAuth.isAdminLoggedOut,couponController.viewCouponPage)
router.post('/addCoupon',adminAuth.isAdminLoggedOut,couponController.addNewCoupon)
router.get('/wallet',adminAuth.isAdminLoggedOut,walletController.viewWallet)
router.get('/page-not-found',adminAuth.isAdminLoggedOut,adminController.viewErrorPage)
//     (req,res)=>{
//     res.render('admin/login')
// })

// router.get('/dashboard',(req,res)=>{
//     res.render('admin/dashboard')
// })

router.get('/salesReport',salesReportHelper.productsSold)



module.exports=router
