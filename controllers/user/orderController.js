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


const createOrder = async (req, res) => {
  try {
    const userId = req.session._id;

    const { addressId, paymentType, additionalInformation, razorpayOrderId, razorpayPaymentId } = req.body;
    const { grandTotal, shipping, totalAmount, totalQuantity } = req.session;

    const user = await userSchema.findOne({ _id: userId, isBlocked: false, isOTPVerified: true })
      .select('name email phone cart addresses');

    if (!user) return res.status(404).json({ message: 'User not found' });

    let checkTotalQuantity = 0, checkGrandTotal = 0, checkTotalAmount = 0;

    const cart = await Promise.all(user.cart.map(async (item) => {
      const product = await productSchema.findOne({ _id: item.productId, isBlocked: false })
        .populate([
          { path: 'brand', select: 'brandName isBlocked -_id' },
          { path: 'category', select: 'categoryName isListed -_id' },
          { path: 'size', select: 'size' }
        ]).lean();

      if (!product) return res.status(400).json({ message: `Product not found` });

      if (item.quantity > product.quantity)
        return res.status(400).json({ message: `Not enough stock for '${product.productName}'` });

      if (product.brand.isBlocked || !product.category.isListed)
        return res.status(400).json({ message: `Product '${product.productName}' is not available for sale` });

      checkTotalQuantity += item.quantity;
      checkTotalAmount += product.promotionalPrice * item.quantity;

      return { product, quantity: item.quantity };
    }));

    if (checkTotalQuantity !== totalQuantity || checkTotalAmount !== totalAmount)
      return res.status(400).json({ message: 'Mismatch in cart totals. Please reinitiate checkout.' });

    let checkShipping = 0;
    if (checkTotalQuantity >= 1 && checkTotalQuantity <= 5) checkShipping = 0;
    else if (checkTotalQuantity <= 10) checkShipping = 200;
    else if (checkTotalQuantity <= 15) checkShipping = 300;
    else checkShipping = 500;

    checkGrandTotal = checkShipping + checkTotalAmount;

    if (checkShipping !== shipping)
      return res.status(400).json({ message: 'Error in calculating shipping' });

    if (checkGrandTotal !== grandTotal)
      return res.status(400).json({ message: 'Error in calculating grand total' });

    const shippingAddress = await addressSchema.findOne({ _id: addressId, userId });
    if (!shippingAddress)
      return res.status(404).json({ message: 'Address not found' });

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
      if(grandTotal >1000) return res.status(400).json({message:'Cash On Delivery(COD) is only availabe for payments below 1000, Kindly use RazorPay to make this Order.'})

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
        return res.status(400).json({message:'Not Enough Balance in your Wallet'})
      }
      await newOrder.save()
    }

    user.cart = [];
    user.orderHistory = user.orderHistory || [];
    user.orderHistory.push(newOrder._id);

    await user.save();

    await Promise.all(cart.map(item =>
      productSchema.updateOne({ _id: item.product._id }, { $inc: { quantity: -item.quantity } })
    ));

    res.status(201).json({ message: 'Order placed successfully', orderId: newOrder.orderId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Server error: ${error.message}` });
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
    res.status(500).send('Error creating order');
  }
};


const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const secret = razorpay.key_secret;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);

    if (!isValidSignature)
      return res.status(400).json({ status: 'verification_failed' });

    const tempOrder = await TemporaryOrder.findOne({ order_id: razorpay_order_id });

    if (!tempOrder)
      return res.status(404).json({ status: 'order_not_found' });

    tempOrder.status = 'paid';
    tempOrder.payment_id = razorpay_payment_id;

    await tempOrder.save();

    res.status(200).json({ status: 'ok', tempOrder });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error verifying payment' });
  }
};

const viewOrders = async (req,res)=>{
    const userId = req.session._id
    const user = await  userSchema.findById(userId)
    const orders = await orderSchema.find({userId}).sort({invoiceDate:-1})
    // console.log('list:',orders)
    res.render('users/ordersList',{user,orders})
}

const orderDetail = async (req,res)=>{
   try{ const userId = req.session._id
    const orderId = req.params.orderId
    
    
    const orderExist = await orderSchema.exists({orderId})
    if(!orderExist) return res.status(404).redirect('/pagenotfound')


    const order = await orderSchema.findOne({orderId})
   
    if(!order) return res.status(404).json({message:'order no3t found'})
    
    res.render('users/orderDetail',{order})
   // console.log('new order details',order)

}
catch(error){

}}

const orderTrack = async (req,res)=>{
    try {
        const userId = req.session.id
        const orderId = req.params.orderId
        const orderExists =await  orderSchema.exists({orderId})
        console.log('ordertracking does nt exist',orderExists)
        if(!orderExists) return res.status(404).redirect('/pagenotfound')
        const order = await orderSchema.findOne({orderId})
       // console.log('reached',order,orderId)
        return res.render('users/trackOrder',{order})
    } catch (error) {
        console.log(error)
    }
}

const createInvoice = async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.session._id; 
  
      // Fetch the order
      const order = await orderSchema.findOne({ orderId, userId }).lean();
      if (!order) {
        return res.status(404).json({ message: 'Order not found!' });
      }
  
      // Fetch user data if needed
      const user = await userSchema.findById(userId).lean();
  
      // ✅ Generate and stream PDF invoice
      generateInvoice(order, user, res);
    } catch (error) {
      console.log('Invoice generation error:', error);
      return res.status(500).json({ message: 'Server error while generating invoice.' });
    }
  }
const cancelOrder =async (req, res) => {
    const userId = req.session._id;
    const {reason} =req.body 
    console.log('reason for cancel',reason)
  
    try {
      const { orderId } = req.params;
  
      // Find the order
      const order = await orderSchema.findOne({ orderId, userId });
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      if (order.status === 'Delivered') {
        return res.status(400).json({ message: 'Delivered orders cannot be cancelled' });
      }

      if (order.status === 'Returned' || order.status === 'Return Requested') {
        return res.status(400).json({ message: 'This order is requested for Return or had been returned' });
      }
  
      if (order.status === 'Cancelled') {
        return res.status(400).json({ message: 'Order already cancelled' });
      }
      console.log('update this order,', order)
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
        else return res.status(400).json({message:"One of the producs is not cancellable"})
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
      res.status(200).json({ok:true, message: 'Order cancelled!' });
        console.log('Order Cancelled and products restocked')
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ message: 'Server error while cancelling order.' });
    }
  }


const createOrderViaCod =async(req,res)=>{
    try {
     const userId = req.session._id
     const { grandTotal ,shipping ,totalAmount,totalQuantity }= req.session
     const formData = req.body
     console.log('final after razorpay succedds',userId,formData,grandTotal ,shipping ,totalAmount,totalQuantity )
     if(grandTotal >1000) return res.status(400).json({message:'Cash On Delivery(COD) is availabe for payments below 1000, Kindly use RazorPay to make Payment.'})
     
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


  return res.status(201).json({ message: 'Order placed successfully', orderId: newOrder.orderId });

     //
     
     return res.status(202).json({orderId})
    } catch (error) {
      console.log(error)
      return res.status(500).json({message:error})
    }
  }




  const cancelSingleProduct = async (req,res)=>{
    const userId = req.session._id
    const {orderId} = req.params
    const {reason,itemId,} = req.body
    try {
      const order = await orderSchema.findOne({orderId})
      const restockProduct = await productSchema.findById(itemId)  //PRODUCT TO RESTOCK
      if(!order) return res.status(404).json({message:'Order Not Found'})
      const productIndex = order.orderedItems.findIndex(item=>item.product.toString()=== itemId)
      if(!productIndex){
        
       if(productIndex!==0) return res.status(404).json({message:'Product Not Found in order'})
      }
      if(['Delivered', 'Cancelled', 'Return Requested', 'Returned'].some(val=>{ val ==  order.orderedItems[productIndex].status }) ){
        return res.status(400).json({message:'cannot cancel or return this product'})
      }
      
      //changing sttatus or order
      
        order.orderedItems[productIndex].status='Cancelled'
        order.orderedItems[productIndex].cancellationReason=reason
        order.finalAmount-=(order.orderedItems[productIndex].price*order.orderedItems[productIndex].quantity)
        order.totalPrice-=(order.orderedItems[productIndex].price*order.orderedItems[productIndex].quantity)
        
        console.log('order after 1 prodcut cancel',order)
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
        res.status(200).json({message:'Product Cancelled Succesfully'})

      console.log(reason,itemId,'jkn',productIndex)
      
    } catch (error) {
      console.log(error)
    }
  }

const requestProductReturn = async (req,res)=>{
  try {
    const { orderId, itemId, reason,  } = req.body;

    const order = await orderSchema.findOne({ orderId });
    if (!order) return res.status(404).json({ message: "Order not found!" });

    const item = order.orderedItems.find(item => item.product.toString() === itemId);
    if (!item) return res.status(404).json({ message: "Item not found in order!" });

    if (item.status !== "Delivered") {
        return res.status(400).json({ message: "Only delivered items can be returned." });
    }

    item.status = "Return Requested";
    item.returnReason = reason;
    item.returnRequestedOn = new Date(Date.now());
    
    //console.log(order,'requested order')
    await order.save();
    res.json({ message: "Return request submitted successfully!" });
} catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while requesting return." });
}

}


module.exports ={createOrder,viewOrders,orderDetail,orderTrack,createInvoice,cancelOrder,
                  createOrderRazorpay,verifyRazorpayPayment,createOrderViaCod,cancelSingleProduct,
                  requestProductReturn,}