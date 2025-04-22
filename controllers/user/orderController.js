const userSchema = require('../../models/userSchema')
const addressSchema = require('../../models/addressSchema')
const productSchema = require ('../../models/productSchema')
const orderSchema = require('../../models/orderSchema')
const sizeSchema = require('../../models/sizeSchema')
const brandSchema = require('../../models/brandSchema')
const categorySchema = require('../../models/categorySchema')
const generateInvoice = require('../../helpers/generateInvoice')
const razorpay = require('../../helpers/razorpay')
const {validateWebhookSignature} = require('razorpay/dist/utils/razorpay-utils')
const TemporaryOrder = require('../../models/tempRazorpayOrderSchema')
const walletHelper = require('../../helpers/walletHelper')
const walletSchema = require('../../models/walletSchema')
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require('../../utils/responseMessages')



const createOrder = async (req, res) => {
  try {
    const userId = req.session._id;

    const { addressId, paymentType, additionalInformation, razorpayOrderId, razorpayPaymentId } = req.body;
    const { grandTotal, shipping, totalAmount, totalQuantity } = req.session;

    const user = await userSchema.findOne({ _id: userId, isBlocked: false, isOTPVerified: true })
      .select('name email phone cart addresses');

    if (!user) return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.NOT_FOUND });

    let checkTotalQuantity = 0, checkGrandTotal = 0, checkTotalAmount = 0;

    const cart = await Promise.all(user.cart.map(async (item) => {
      const product = await productSchema.findOne({ _id: item.productId, isBlocked: false })
        .populate([
          { path: 'brand', select: 'brandName isBlocked -_id' },
          { path: 'category', select: 'categoryName isListed -_id' },
          { path: 'size', select: 'size' }
        ]).lean();

      if (!product) return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.PRODUCT_NOT_FOUND });

      if (item.quantity > product.quantity)
        return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: `Not enough stock for '${product.productName}'` });

      if (product.brand.isBlocked || !product.category.isListed)
        return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: `Product '${product.productName}' is not available for sale` });

      checkTotalQuantity += item.quantity;
      checkTotalAmount += product.promotionalPrice * item.quantity;

      return { product, quantity: item.quantity };
    }));

    if (checkTotalQuantity !== totalQuantity || checkTotalAmount !== totalAmount)
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.MISMATCH_IN_TOTAL_AMOUNT });

    let checkShipping = 0;
    if (checkTotalQuantity >= 1 && checkTotalQuantity <= 5) checkShipping = 0;
    else if (checkTotalQuantity <= 10) checkShipping = 200;
    else if (checkTotalQuantity <= 15) checkShipping = 300;
    else checkShipping = 500;

    checkGrandTotal = checkShipping + checkTotalAmount;

    if (checkShipping !== shipping)
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.ERROR_IN_CALCULATING_SHIPPING });

    if (checkGrandTotal !== grandTotal)
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.ERROR_IN_CALCULATING_GRAND_TOTAL });

    const shippingAddress = await addressSchema.findOne({ _id: addressId, userId });
    if (!shippingAddress)
      return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ADDRESS_NOT_FOUND });

    const orderedItems = cart.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.promotionalPrice,
      productName: item.product.productName,
      productDetails: {
        name: item.product.productName,
        images: [...item.product.productImages],
        brand: item.product.brand.brandName,
        category: item.product.category.categoryName
      }
    }));

    const newOrder = new orderSchema({
      userId,
      userData: {
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      orderedItems,
      shippingCharge: checkShipping,
      totalPrice: checkTotalAmount,
      finalAmount: checkGrandTotal,
      discount: 0,
      address: { ...shippingAddress.toObject() },
      invoiceDate: new Date(),
      status: 'Processing',
      paymentMethod: paymentType,
      couponApplied: false,
      orderNotes: additionalInformation,
      totalQuantity: checkTotalQuantity
    });

    if (paymentType === 'cod') {
      if(grandTotal >1000) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.COD_ONLY_ABOVE_1000})

      await newOrder.save();
    } else if (paymentType === 'razorpay') {
      newOrder.paymentDetails = {
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId
      };
     await newOrder.save();
     await walletHelper.updateAdminWallet(userId,'CREDIT',newOrder.finalAmount,'Order Payment',newOrder.orderId,`New_order_placed`)
    }
    else if(paymentType ==='wallet'){
      let userWallet = await walletSchema.findOne({userId})
      if(userWallet.balance<grandTotal){
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.NOT_ENOUGH_BALANCE_IN_WALLET })
      }
      await newOrder.save()
      await walletHelper.deductAmount(userId,grandTotal,'PURCHASE_DEDUCT',newOrder.orderId, )
      await walletHelper.updateAdminWallet(userId,'CREDIT',newOrder.finalAmount,'Order Payment',newOrder.orderId,`New_order_placed`)

    }

    user.cart = [];
    user.orderHistory = user.orderHistory || [];
    user.orderHistory.push(newOrder._id);

    await user.save();

    await Promise.all(cart.map(item =>
      productSchema.updateOne({ _id: item.product._id }, { $inc: { quantity: -item.quantity } })
    ));

    res.status(RESPONSE_CODES.CREATED).json({ message: MESSAGES.ORDER_PLACED_SUCCESSFULLY , orderId: newOrder.orderId });

  } catch (error) {
    console.error(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: `Server error: ${error.message}` });
  }
};

const createOrderRazorpay = async (req, res) => {
  try {
    const userId = req.session._id;
    const user = await userSchema.findById(userId);

    const { amount, currency, receipt, notes } = req.body;

    const options = {
      amount: amount * 100,
      currency,
      receipt,
      notes
    };

    const order = await razorpay.orders.create(options);

    const tempOrder = new TemporaryOrder({
      userId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: 'created',
      notes: notes || {},
      userEmail: user.email,
      userName: user.name,
      userPhone: user.phone
    });

    await tempOrder.save();

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).send('Error creating order');
  }
};

const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const secret = razorpay.key_secret;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);

    if (!isValidSignature)
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ status: 'verification_failed' });

    const tempOrder = await TemporaryOrder.findOne({ order_id: razorpay_order_id });

    if (!tempOrder)
      return res.status(RESPONSE_CODES.NOT_FOUND).json({ status: MESSAGES.ORDER_NOT_FOUND });

    tempOrder.status = 'paid';
    tempOrder.payment_id = razorpay_payment_id;

    await tempOrder.save();

    res.status(RESPONSE_CODES.OK).json({ status: 'ok', tempOrder });

  } catch (error) {
    console.error(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ status: 'error', message: MESSAGES.ERROR_VERIFYING_PAYMENT });
  }
};

const viewOrders = async (req,res)=>{
  const userId = req.session._id
    let totalItems, limit=5, totalPages,currentPage
    currentPage = parseInt(req.query.page,10) ||1
    if(currentPage<1) currentPage=1
    let allOrders = await orderSchema.find({userId})
    totalItems = allOrders.length
    totalPages = Math.ceil(totalItems/limit)
    const user = await  userSchema.findById(userId)
    const orders = await orderSchema.find({userId}).sort({invoiceDate:-1})
    .skip((currentPage-1)*limit).limit(limit)
    res.render('users/ordersList',{user,orders,totalItems, limit, totalPages,currentPage})
}

const orderDetail = async (req,res)=>{
   try{ const userId = req.session._id
    const orderId = req.params.orderId
    
    
    const orderExist = await orderSchema.exists({orderId})
    if(!orderExist) return res.status(RESPONSE_CODES.NOT_FOUND).redirect('/pagenotfound')


    const order = await orderSchema.findOne({orderId})
   
    if(!order) return res.status(RESPONSE_CODES.NOT_FOUND).json({message:MESSAGES.ORDER_NOT_FOUND})
    
    res.render('users/orderDetail',{order})

}
catch(error){

}
}


const orderTrack = async (req,res)=>{
    try {
        const userId = req.session.id
        const orderId = req.params.orderId
        const orderExists =await  orderSchema.exists({orderId})
        if(!orderExists) return res.status(RESPONSE_CODES.NOT_FOUND).redirect('/pagenotfound')
        const order = await orderSchema.findOne({orderId})
        return res.status(RESPONSE_CODES.OK).render('users/trackOrder',{order})
    } catch (error) {
        console.log(error)
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/admin/internal-server-error')

    }
}

const createInvoice = async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.session._id; 
  
      // Fetch the order
      const order = await orderSchema.findOne({ orderId, userId }).lean();
      if (!order) {
        return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ORDER_NOT_FOUND });
      }
  
      // Fetch user data if needed
      const user = await userSchema.findById(userId).lean();
  
      // ✅ Generate and stream PDF invoice
      generateInvoice(order, user, res);
    } catch (error) {
      console.log('Invoice generation error:', error);
      return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
  }

const cancelOrder =async (req, res) => {
    const userId = req.session._id;
    const {reason} =req.body 
  
    try {
      const { orderId } = req.params;
  
      // Find the order
      const order = await orderSchema.findOne({ orderId, userId });
  
      if (!order) {
        return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ORDER_NOT_FOUND });
      }
  
      if (order.status === 'Delivered') {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.DELIVERED_ORDERS_CANNOT_BE_CANCELLED});
      }

      if (order.status === 'Returned' || order.status === 'Return Requested') {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.THIS_ORDER_IS_REQUESTED_FOR_RETURN  });
      }
  
      if (order.status === 'Cancelled') {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.ORDER_ALREADY_CANCELLED  });
      }
      // ✅ Update the order status
      order.orderedItems
      order.status = 'Cancelled';
      order.cancellationReason = reason;
      order.cancellationDate = new Date(Date.now())
      for(let nos=0;nos<order.orderedItems.length;nos++){
        if(order.orderedItems[nos].status =="Shipped" || order.orderedItems[nos].status==='Processing'){
          order.orderedItems[nos].status = 'Cancelled';
          order.orderedItems[nos].cancellationReason = reason
        } 
        else return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.ONE_OF_THE_PRODUCTS_IS_NOT_CANCELLABLE })
      }

      await order.save();
  
      // ✅ Iterate through ordered items and increment product quantity
      const restockPromises = order.orderedItems.map(async (item) => {
        const product = await productSchema.findById(item.product);
  
        if (product) {
          product.quantity += item.quantity; // Add back the quantity
          await product.save();
        } else {
          console.warn(`Product with ID ${item.product} not found while restocking.`);
        }
      });
  
      await Promise.all(restockPromises);
      if(order.paymentMethod !=='cod'){
      walletHelper.addCredit(userId,order.finalAmount,'ORDER_CANCEL_REFUND',order._id,)
      walletHelper.updateAdminWallet(userId,'DEBIT',order.finalAmount,'Order_Cancellation',order.orderId,``)
    }
      res.status(RESPONSE_CODES.OK).json({ok:true, message: MESSAGES.ORDER_CANCELLED });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
  }

const createOrderViaCod =async(req,res)=>{
    try {
     const userId = req.session._id
     const { grandTotal ,shipping ,totalAmount,totalQuantity }= req.session
     const formData = req.body
     console.log('final after razorpay succedds',userId,formData,grandTotal ,shipping ,totalAmount,totalQuantity )
     if(grandTotal >1000) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message:MESSAGES.COD_ONLY_ABOVE_1000})
     
    // Copy address fields into a plain object
    const copiedAddress = {
      fullname: shippingAddress.fullname,
      state: shippingAddress.state,
      district: shippingAddress.district,
      house_flat: shippingAddress.house_flat,
      pincode: shippingAddress.pincode,
      landmark: shippingAddress.landmark,
      mobile: shippingAddress.mobile,
      alt_phone: shippingAddress.alt_phone,
      village_city: shippingAddress.village_city,
      street: shippingAddress.street,
      addressType: shippingAddress.addressType
    };
    
  const orderedItems = cart.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.promotionalPrice,
      productName: item.product.productName,
      productDetails:{
        name:item.product.productName,
        images:[...item.product.productImages],
        brand : item.product.brand.brandName,
        category: item.product.category.categoryName
      }
  }));

  const newOrder = new orderSchema({
      userId,
      userData:{
        name:user.name, email:user.email,phone:user.phone
      },
      orderedItems,
      shippingCharge:checkShipping,
      totalPrice: checkTotalAmount,
      finalAmount: checkGrandTotal,
      discount: 0, // You can modify this based on coupon logic
      address: copiedAddress,
      invoiceDate: new Date(),
      status: 'Processing',
      paymentMethod: paymentType,
      paymentDetails: {
          transactionId: '', 
          orderId: '' ,
      },
      couponApplied: false, // Update if coupon applied
      orderNotes:additionalInformation,
      totalQuantity:checkTotalQuantity
  });

  await newOrder.save();

  // Optional: clear user cart after successful order
  user.cart = [];
  if (!user.orderHistory) {
      user.orderHistory = []; // Initialize as an empty array
    }
  user.orderHistory.push(newOrder._id)
  await user.save();

  // Decrease quantity of each purchased product
  await Promise.all(cart.map(async (item) => {
  const productId = item.product._id;
  const purchasedQty = item.quantity;

  // Use $inc operator to decrease the quantity atomically
  await productSchema.updateOne(
      { _id: productId },
      { $inc: { quantity: -purchasedQty } }
  );
  }));


  return res.status(RESPONSE_CODES.CREATED).json({ message: MESSAGES.ORDER_PLACED_SUCCESSFULLY , orderId: newOrder.orderId });

    } catch (error) {
      console.log(error)
      return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message:error})
    }
  }

const cancelSingleProduct = async (req,res)=>{
    const userId = req.session._id
    const {orderId} = req.params
    const {reason,itemId,} = req.body
    try {
      const order = await orderSchema.findOne({orderId})
      const restockProduct = await productSchema.findById(itemId)  //PRODUCT TO RESTOCK
      if(!order) return res.status(RESPONSE_CODES.NOT_FOUND).json({message:MESSAGES.ORDER_NOT_FOUND})
      const productIndex = order.orderedItems.findIndex(item=>item.product.toString()=== itemId)
      if(!productIndex){
        
       if(productIndex!==0) return res.status(RESPONSE_CODES.NOT_FOUND).json({message: MESSAGES.PRODUCT_NOT_FOUND_IN_ORDER })
      }
      if(['Delivered', 'Cancelled', 'Return Requested', 'Returned'].some(val=>{ val ==  order.orderedItems[productIndex].status }) ){
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({message:MESSAGES.CANNOT_CANCEL_OR_RETURN_THIS_PRODUCT})
      }
      
      //changing sttatus or order
      
        order.orderedItems[productIndex].status='Cancelled'
        order.orderedItems[productIndex].cancellationReason=reason
        order.finalAmount-=(order.orderedItems[productIndex].price*order.orderedItems[productIndex].quantity)
        order.totalPrice-=(order.orderedItems[productIndex].price*order.orderedItems[productIndex].quantity)
        
        restockProduct.quantity+=order.orderedItems[productIndex].quantity

        if(order.orderedItems.every(item=>item.status=='Cancelled')) {
          order.finalAmount-=order.shippingCharge
          order.status='Cancelled'
          order.cancellationDate=new Date(Date.now())
          order.cancellationReason = 'All products Cancelled'
        }
       await order.save()
       await restockProduct.save()

       if(order.paymentMethod !=='cod'){
        walletHelper.addCredit(userId,(order.orderedItems[productIndex].price*order.orderedItems[productIndex].quantity),'PRODUCT_CANCEL_REFUND',order._id,order.orderedItems[productIndex].product,reason)
        }
        res.status(RESPONSE_CODES.OK).json({message: MESSAGES.PRODUCT_CANCELLED_SUCCESS })

      
    } catch (error) {
      console.log(error)
      res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/admin/internal-server-error')
    }
  }

const requestProductReturn = async (req,res)=>{
  try {
    const { orderId, itemId, reason,  } = req.body;

    const order = await orderSchema.findOne({ orderId });
    if (!order) return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ORDER_NOT_FOUND });

    const item = order.orderedItems.find(item => item.product.toString() === itemId);
    if (!item) return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ITEM_NOT_FOUND_IN_ORDER });

    if (item.status !== "Delivered") {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.ONLY_DELIVERED_ITEMS_CAN_BE_RETURNED });
    }

    item.status = "Return Requested";
    item.returnReason = reason;
    item.returnRequestedOn = new Date(Date.now());
    
    await order.save();
    res.status(RESPONSE_CODES.OK).json({ message: MESSAGES.RETURN_REQUESTED_SUBMITTED_SUCCESSFULLY  });
} catch (error) {
    console.error(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
}

}

const OrderDetail = async (req,res)=>{
  try{ const userId = req.session._id
   const orderId = req.params._id
   
   const orderExist = await orderSchema.exists({_id:orderId})
   if(!orderExist) return res.status(RESPONSE_CODES.NOT_FOUND).redirect('/pagenotfound')


   const order = await orderSchema.findOne({_id:orderId})
  
   if(!order) return res.status(RESPONSE_CODES.NOT_FOUND).json({message: MESSAGES.ORDER_NOT_FOUND })
   
   res.status(RESPONSE_CODES.OK).render('users/orderDetail',{order})

}
catch(error){
  console.log(error)
  res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/admin/internal-server-error')
}
}

module.exports ={createOrder,viewOrders,orderDetail,orderTrack,createInvoice,cancelOrder,
                  createOrderRazorpay,verifyRazorpayPayment,createOrderViaCod,cancelSingleProduct,
                  requestProductReturn,OrderDetail}