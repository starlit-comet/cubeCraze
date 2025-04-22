const MESSAGES = Object.freeze({
  // Success Messages
  SUCCESS: "Success",
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",

  // Client Error Messages
  ERROR: "Something went wrong",
  BAD_REQUEST: "Invalid request data",
  VALIDATION_FAILED: "Validation failed",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden action",
  NOT_FOUND: "Resource not found",
  CONFLICT: "Resource conflict",

  // Server Error Messages
  INTERNAL_SERVER_ERROR: "Internal server error",
  DATABASE_ERROR: "Database connection failed",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  TIMEOUT: "Server took too long to respond",
  UNKNOWN_ERROR: "An unknown error occurred",

  //custom messages
  EMAIL_NOT_FOUND: "Email Not Found",
  OTP_EXPIRED_GENERATED_NEWONE:"Otp Expired, Hence generated a new OTP and sent it to your mail",
  OTP_ALREADY_CREATED_PLEASE_WAIT:"OTP already created, please wait before resending",
  OTP_SEND_TO_MAIL:"OTP sent to mail id",
  OTP_VERIFIED:"OTP verified",
  OTP_NOT_MATCHING:"OTP not matching",
  INCORRECT_OTP:"Incorrect OTP. Please try again.",
  OTP_EXPIRED_GENERATE_NEW_ONE:"Otp expired Kindly,click send OTP to Generate a new one",
  PASSWORD_CANNOT_BE_EMPTY:"Passwords cannot be empty",
  PASSWORD_CHANGE_SUCCESS:'"Your Password Has been Changed Succesfully"',
  PASSWORDS_NOT_MATCHING:"passwords not matching",
  EMAIL_AND_PASSWORD_ARE_REQUIRED: "Email and Password are required",
  USER_NOT_OTP_VERIFIED:"User is Not OTP verified redirecting to verify otp",
  INVALID_PASSWORD: "Invalid Password",
  PASSWORD_NOT_STRONG:`Password Not Strong, kindly incluede a Captial letter, a small letter, a symbol, a number
             ,a special character. Password should have length of 8`,
  LOGIN_SUCCESS: "LOGIN SUCCESS",
  REFERAL_CODE_NOT_VALID:"Referal Code not Valid kindly try another or give it as empty",
  NEW_ACCOUNT_CREATED_VERIFY_OTP:"New Account Created Please verify OTP to continue",
  EMAIL_REQUIRED: "Email is required",
  ADMIN_DATA_NOT_FOUND: "Admin Data not Found",
  BRAND_NAME_AND_IMAGE_ARE_REQUIRED: "Brand name and image are required",
  BRAND_NAME_ALREADY_EXISTS: "BrandName Already Exists",
  ALL_FIELDS_ARE_REQUIRED: "All fields are required",
  CATEGORY_ALREADY_EXISTS: "Category Already Exists",
  CATEGORY_NOT_FOUND: "Category not found",
  ERROR_CREATING_NEW_ACCOUNT:'Error Creating new Account',
  MIN_AMOUNT_ERR: "minimum amount should be larger than discount value",
  PERCENTAGE_MORETHAN_100: "Percentage discount cannot exceed 100%",
  PERCENTAGE_LESSTHAN_0: "Percentage should be greater than 0",
  COUPON_CREATED: "Coupon created successfully!",
  ENTER_A_SEARCH_VALUE: "Enter a Search Value",
  ORDER_NOT_FOUND: "Order Not Found",
  CANT_MAKE_ANY_OTHER_CHANGES: "Can't make any further changes to this order",
  ONLY_PENDING_ORDERS_CANBE_CHANGED_TO_SHIPPING:
    "Only pending orders can be changed to shipped",
  ONLY_SHIPPED_ORDERS_CAN_BE_CHANGED_TO_DELIVERED:
    "Only shipped orders can be changed to delivered",
  INVALID_STATUS_UPDATE: "Invalid status update",
  ORDER_NOT_FOUND: "Order not found!",
  INVALID_FILE_TYPE_REQUESTED: "Invalid file type requested.",
  ITEM_NOT_FOUND_IN_ORDER: "Item not found in order!",
  ITEM_NOT_IN_RETURN_REQUEST: "This item is not in return requested status.",
  RETURN_APPROVED_AND_PROCESSED_SUCCESSFULLY:
    "Return approved and processed successfully!",
  RETURN_REQUEST_NOT_FOUND_OR_ALREADY_PROCESSED:
    "Return request not found or already processed",
  MINIMUN_QUANTIY_NOT_ACHIEVED:
    "Minimum Quanity of 5 is needed to add a product",
  MINIMUM_THREE_IMAGES_REQUIRED: "Minimum Three Images are required",
  PRODUCT_ADDED_SUCCESSFULLY: "Product added successfully!",
  NO_EDIT_IN_PRODUCT_DATA: "No Edit in Product Data found",
  QUANTITY_CANNOT_BE_LESSTHAN_0: " Quantity can't be less than 0 ",
  PRODUCT_EDITED: "Product Edited",
  SIZE_ALREADY_EXISTS: "Size Already Exists",
  NAME_SHOULD_NOT_CONTAIN_SYMBOLS:
    "Name field Should not contain symbols, if required add space in between!",
  INVALID_PINCODE: "Invalid Pincode! It must be 6 digits.",
  INVALID_MOBILE_NUMBER: "Invalid Mobile Number! It must be 10 digits.",
  INVALID_ALT_MOBILE: "Invalid Alternate Phone! It must be 10 digits.",
  ADDRESS_ADDEDD_SUCCESSFULLY: "Address added successfully!",
  INVALID_REQUEST_MISSING_USERID_OR_ADDRESS:
    "Invalid request: Missing user or address ID.",
  ADDRESS_NOT_FOUND_OR_NOT_AUTHORISED: "Address not found or not authorized.",
  ADDRESS_UPDATED_SUCCESSFULLY: "Address updated successfully.",
  INVALID_REQ_MISSING_USER_OR_ADDRESS_ID:
    "Invalid request: Missing user or address ID.",
  INVALID_ADDRESS_ID_FORMAT: "Invalid address ID format.",
  YOU_MUST_HAVE_AT_LEAST_ONE_ADDRESS: "You must have at least one address.",
  ADDRESS_DELETED_SUCCESSFULLY: "Address deleted successfully.",
  PRODUCT_NOT_AVAILABLE: `Product is Not Available (It's category or band may be blocked by Admin). This product will be removed from your cart`,
  ATLEAST_ONE_QUANTITY_IS_REQUIRED:
    "Atleast one quanitity is required inorder to add product to cart",
  REQUESTED_QUANTITY_IS_NOT_AVAILABLE:
    "Requested quantity is not available in the supplier, kindly reduce the quantity ",
  PRODUCT_ADDED_TO_CART: "Product Added to Cart",
  PRODUCT_REMOVED_FROM_CART: "Product removed from cart",
  YOUR_CART_IS_EMPTY: "Your Cart Is Empty",
  PRODUCT_NOT_FOUND: `Product not found`,
  MISMATCH_IN_TOTAL_AMOUNT:
    "Mismatch in cart totals. Please reinitiate checkout.",
  ERROR_IN_CALCULATING_SHIPPING: "Error in calculating shipping Amount",
  ERROR_IN_CALCULATING_GRAND_TOTAL: "Error in calculating grand total",
  ADDRESS_NOT_FOUND: "Address not found",

  COD_ONLY_ABOVE_1000:
    "Cash On Delivery(COD) is only availabe for payments below 1000, Kindly use RazorPay to make this Order.",
  NOT_ENOUGH_BALANCE_IN_WALLET: "Not Enough Balance in your Wallet",
  ORDER_PLACED_SUCCESSFULLY: "Order placed successfully",
  ERROR_VERIFYING_PAYMENT: "Error verifying payment",

  DELIVERED_ORDERS_CANNOT_BE_CANCELLED: "Delivered orders cannot be cancelled",
  THIS_ORDER_IS_REQUESTED_FOR_RETURN:
    "This order is requested for Return or had been returned",
  ORDER_ALREADY_CANCELLED: "Order already cancelled",
  ONE_OF_THE_PRODUCTS_IS_NOT_CANCELLABLE:
    "One of the producs is not cancellable",
  ORDER_CANCELLED: "Order Cancelled",
  PRODUCT_NOT_FOUND_IN_ORDER: "Product Not Found In Order",
  CANNOT_CANCEL_OR_RETURN_THIS_PRODUCT: "cannot cancel or return this product",
  PRODUCT_CANCELLED_SUCCESS: "Product Cancelled Succesfully",
  ITEM_NOT_FOUND_IN_ORDER: "Item not found in order!",
  ONLY_DELIVERED_ITEMS_CAN_BE_RETURNED: "Only delivered items can be returned.",
  RETURN_REQUESTED_SUBMITTED_SUCCESSFULLY:
    "Return request submitted successfully!",
  USER_NOT_AUTHENTICATED: "User not Authenticated",
  USER_NOT_FOUND_WHILE_REMOVING_PRODUCT:
    "User Not found while removing Product",
  PRODUCT_REMOVED_SUCCESSFULLY: "product removed succesfully",
  USER_NOT_FOUND: "User Not Found!",
  PRODUCT_ALREADY_IN_WISHLIST: "Product already in wishlist",
  PRODUCT_ALREADY_IN_CART: "Product already in Cart",
  PRODUCT_ADDED_TO_WISHLIST: "Product added to wishlist",
  PRODUCT_NOT_FOUND_IN_CART: "Product Not found in Cart",
  PRODUCT_QUANTITY_CANNOT_BE_MORE_THAN_10:
    "Product Quantity Cannot be added more than 10",
   PRODUCT_QUANTITY_CANNOT_BE_LESSTHAN_1: 'Product Quantity Cannot be less than 1',
   USER_ALREADY_EXISTS:'User Already Exists',
   NAME_CANNOT_BE_EMPTY: "Name cannot be empty",
   OTP_REQUIRED:'OTP is required..',
   REDIRECTING_TO_OTP_PAGES:"redirecting to password page",
   USER_ALREADY_VERIFIED:"User Already Verified",
   KINDLY_WAIT_FOR_SOME_TIME:"kindly wait for some time to redend the otp",
   OTP_RESEND_SUCCESS:"Otp resend success",
   ACCOUNT_FOUND:'Account Found!',
   YOU_ARE_NOT_AUTHORISED_TO_CHANGE_PASSWORD:"You are Not authorised to change password" ,
   INCORRECT_CURRENT_PASSWORD: "Current Password is Incorrect",
   PROFILE_IMAGE_UPDATE_FAILED:'Profile Image cannot be added now.',
   PROFILE_IMAGE_UPDATE_SUCCESS: "Profile Image Updated",
   INVALIID_NAME_FORMAT: "Invalid name format" ,
   NO_CHANGES_FOUND : "No changes detected" ,
   USER_DATA_CHANGE_SUCCESS:"User details changed successfully",
   



});

module.exports = MESSAGES;
