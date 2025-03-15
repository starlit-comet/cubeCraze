const userSchema = require('../../models/userSchema')
const addressSchema = require('../../models/addressSchema')
const productSchema = require ('../../models/productSchema')
const orderSchema = require('../../models/orderSchema')
const sizeSchema = require('../../models/sizeSchema')
const brandSchema = require('../../models/brandSchema')
const categorySchema = require('../../models/categorySchema')
const generateInvoice = require('../../helpers/generateInvoice')

const createOrder = async (req,res,)=>{
    try{
    const userId = req.session._id
    const {addressId,paymentType,additionalInformation} =  req.body
    const {grandTotal, shipping,totalAmount,totalQuantity} = req.session

    const user = await userSchema.findOne({_id:userId,isBlocked:false,isOTPVerified:true})
    .select('name email phone cart addresses')
   // console.log(user.cart)
    let checkTotalQuantity=0 ,checkGrandTotal=0,checkTotalAmount=0
    const cart = await Promise.all(user.cart.map(async (item)=>{
        const product= await productSchema.findOne({_id:item.productId,isBlocked:false})
        .populate([
            { path: 'brand', select: 'brandName isBlocked -_id' },
            { path: 'category', select: 'categoryName isListed -_id' },
            { path: 'size', select: 'size' }
          ]) .lean()
        if(item.quantity>product.quantity) return res.status(400).json({message:`The requested quanity of '${product.productName}' is not availabe in the stock. kindly reduce its quantity from cart page`})
        if(product.brand.isBlocked || !product.category.isListed) return res.status(400).json({message:`The product '${product.productName}' is not availabe for sale(category or brand is blocked by admin). Kindly remove the product from cart to make a purchase`})
            checkTotalQuantity+=item.quantity
        checkTotalAmount+= 1 * product.promotionalPrice*item.quantity
        return {product,quantity:item.quantity}
    }))
   // console.log('jiij',cart[0].product)
    //console.log(addressId,paymentType,additionalInformation,grandTotal, shipping,totalAmount,totalQuantity)
    if(checkTotalQuantity!==totalQuantity || checkTotalAmount!== totalAmount) return res.status(400).json({message:'Error Calculating total quantity or total Amount'})
    // const shippingRates = [0, 200, 300, 500, 500];
    // const checkShipping = shippingRates[Math.min(Math.floor(checkTotalQuantity / 5), 4)];
    if(checkTotalQuantity>=1 && checkTotalQuantity<=5) checkShipping = 0
    else if(checkTotalQuantity>=6 && checkTotalQuantity<=10) checkShipping = 200
    else if(checkTotalQuantity>=11 && checkTotalQuantity<=15) checkShipping = 300
    else  checkShipping = 500

    checkGrandTotal = checkShipping + checkTotalAmount
    if(checkShipping !== shipping) return res.status(400).json({message:`Error in Calculating Shipping Charges`})
    if(checkGrandTotal !== grandTotal) return res.status(400).json({message:`Error in Calculating Total Amount Including shipping Charges`})
    const shippingAddress = await addressSchema.findOne({_id:addressId,userId})
    if (!shippingAddress) {
        return res.status(404).json({ message: 'Address not found' });
    }

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
        productName: item.product.productName
    }));

    const newOrder = new orderSchema({
        userId,
        orderedItems,
        shippingCharge:checkShipping,
        totalPrice: checkTotalAmount,
        finalAmount: checkGrandTotal,
        discount: 0, // You can modify this based on coupon logic
        address: copiedAddress,
        invoiceDate: new Date(),
        status: 'Pending',
        paymentMethod: paymentType,
        paymentDetails: {
            transactionId: '', // Fill when payment is successful
            orderId: '' // Can be linked to payment gateway orderId
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

    
} catch(error){
    console.log(error)
    return res.status(500).json({message:`server Error: ${error}`})
}}

const viewOrders = async (req,res)=>{
    const userId = req.session._id

}

const orderDetail = async (req,res)=>{
   try{ const userId = req.session._id
    const orderId = req.params.orderId
    
    const order = await orderSchema.findOne({orderId})
    .populate('userId')
    .populate({
        path:'orderedItems.product',
        select:'productName productImages promotionalPrice brand cateogory size',
        populate:[
            {path: 'brand', select:'brandName'},
            {path:'size', select:'size'},
            {path:'category',select:'categoryName'}
        ]
    })
    if(!order) return res.status(404).json({message:'order not found'})
    
    res.render('users/orderDetail',{order})
    console.log(order)

}
catch(error){

}}


const orderTrack = async (req,res)=>{
    try {
        const userId = req.session.id
        const orderId = req.params.orderId
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
      const userId = req.session._id; // Secure access, if session available
  
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
  
      if (order.status === 'Cancelled') {
        return res.status(400).json({ message: 'Order already cancelled' });
      }
  
      // ✅ Update the order status
      order.status = 'Cancelled';
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
  
      res.status(200).json({ message: 'Order cancelled and products restocked successfully.' });
  
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ message: 'Server error while cancelling order.' });
    }
  }
module.exports ={createOrder,viewOrders,orderDetail,orderTrack,createInvoice,cancelOrder}