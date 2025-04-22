const userSchema = require('../../models/userSchema')
const addressSchema = require('../../models/addressSchema')
const productSchema = require ('../../models/productSchema')
const orderSchema = require('../../models/orderSchema')
const couponSchema = require('../../models/referalCouponSchema')
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require('../../utils/responseMessages')
const { response } = require('express')

const viewCart = async (req,res)=>{
try{
const userId = req.session._id
const cartItems = await userSchema.findById(userId).select('cart -_id')
let cart = []
for(let item of cartItems.cart){
    let product = await productSchema.findById(item.productId).populate([
        { path: 'brand' },
        { path: 'category' },
        { path: 'size' },
    ]).lean()
    Object.assign(product,{cartQuantity:item.quantity})
    cart.push(product)
}
 let totalQuantity =0,totalAmount =0,shipping=0, grandTotal=0
 cart.forEach(item=>{
    totalQuantity += item.cartQuantity
    totalAmount += item.promotionalPrice * item.cartQuantity
 })
 if(totalQuantity<=5) shipping =0
    else if(totalQuantity<=10) shipping =200
    else if(totalQuantity<=20) shipping = 300
    else shipping = 500
    grandTotal = totalAmount + shipping
    req.session.grandTotal =grandTotal
    req.session.shipping = shipping
    req.session.totalAmount = totalAmount
    req.session.totalQuantity = totalQuantity
res.status(RESPONSE_CODES.OK).render('users/cart',{cart,searchKeyWord:'',minPrice:0,maxPrice:7500,totalQuantity,totalAmount,shipping,grandTotal})
}
catch(error){
    console.log(error)
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/admin/internal-server-error')
}
}

const addToCart = async (req,res)=>{
try {
    const {productId,quantityToAdd} = req.body
    const userId = req.session._id
    const user = await userSchema.findById(userId)
    const existingItemIndex = user.cart.findIndex(item => 
        item.productId.toString() === productId
    );
    const productData = await productSchema.findById(productId).populate([
        { path: 'brand' },
        { path: 'category' },
        { path: 'size' },
    ]).lean()

        if(!productData.category.isListed || productData.brand.isBlocked)    return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.PRODUCT_NOT_AVAILABLE })

    if(productData . isBlocked ){ 
        user.cart.pull(productId)
        await user.save()
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.PRODUCT_NOT_AVAILABLE })
    }

    
    if(quantityToAdd <1 ) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.ATLEAST_ONE_QUANTITY_IS_REQUIRED })
    if(productData.quantity < quantityToAdd)  return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.REQUESTED_QUANTITY_IS_NOT_AVAILABLE })

    if(user.cart[existingItemIndex] && user.cart[existingItemIndex].quantity + 1* quantityToAdd >10){
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
            message: `Product Already in cart, Total  quantity of the product  exceeds maximum limit of 10. kindly reduce the quantity to max ${10-user.cart[existingItemIndex].quantity}`,
            status:'updated'
            })
    }
    else if (existingItemIndex > -1) {
        // If exists, increment the quantity (or replace quantity)
        let countOfQuantity = user.cart[existingItemIndex].quantity += 1* quantityToAdd;
        user.wishList.pull(productId)

        await user.save();

        return res.status(RESPONSE_CODES.OK).json({
        message: `Product Already in cart, Hence quantity of the product is increased to ${countOfQuantity}`,
        status:'updated'
        })
    }
    
    
    else {
        // If not exists, push a new entry
        user.cart.push({ productId, quantity: quantityToAdd })
        user.wishList.pull(productId)
        await user.save();
        
        return res.status(RESPONSE_CODES.OK).json({message: MESSAGES.PRODUCT_ADDED_TO_CART ,status:"Added"});
    }

} catch (error) {
    console.log(error)
    return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
        message: MESSAGES.INTERNAL_SERVER_ERROR,
        Status:'Error'
    })
}
}

const removeFromCart = async (req,res)=>{
    try{
const productId = req.body.productId
const userId = req.session._id
const user = await userSchema.findById(userId)
user.cart.pull({productId})
await user.save()
return res.status(RESPONSE_CODES.OK).json({ message: MESSAGES.PRODUCT_REMOVED_FROM_CART  ,success:true});


}
catch (error) {
    console.error('Error removing from cart:', error);
    return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
  }

}
const cartCheck = async (req,res)=>{
    const   userId = req.session._id
    const cartItems = await userSchema.findById(userId).select('cart -_id')
    if(cartItems.cart.length<1) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.YOUR_CART_IS_EMPTY })
        return res.status(RESPONSE_CODES.OK).json({success:true})
}
const checkout = async (req,res)=>{
    const {couponCode} = req.query || ''
    grandTotal = req.session.grandTotal   
   shipping = req.session.shipping     
   totalAmount = req.session.totalAmount  
   totalQuantity = req.session.totalQuantity
    try{
        let couponVal=0
        if(couponCode){
            let couponData = await couponSchema.findOne({code:couponCode})
            if(couponData){
                if(couponData.discountType=='fixed'){
                    couponVal = couponData.discountValue
                    grandTotal=grandTotal-couponVal
                }
                else if (couponData.discountType=='percentage'){
                    couponVal = Math.round(grandTotal*(couponData.discountValue/100))
                    if(couponVal>couponData.maxDiscount) couponVal = couponData.maxDiscount
                    grandTotal= grandTotal-couponVal
                }
            }
        }
        
          const   userId = req.session._id
          const AllAddress = await userSchema.findOne({_id:userId,isBlocked:false,isOTPVerified:true}).select('addresses -_id')
          let addressData = await Promise.all(
            AllAddress.addresses.map(async (id) => {
                const temp = await addressSchema.findById(id);
                return temp;
            })
        );
        const userData = await userSchema.findById(userId).select('name email phone')


          const cartItems = await userSchema.findById(userId).select('cart -_id')
        let cart = []
        for(let item of cartItems.cart){
            let product = await productSchema.findById(item.productId)
            // .populate([
            //     { path: 'brand' },
            //     { path: 'category' },
            //     { path: 'size' },
            // ])
            .lean()
            product.cartQuantity=item.quantity
        
            if(product.isBlocked===false )     cart.push(product) 
        }
        let coupons = await couponSchema.find({isActive:true}) || []
        const dateNow = new Date()
        coupons = coupons.filter(item=>{
            if(item.expiresAt>dateNow && item.minPurchase<totalAmount){
                return true
            }
        })
        return res.status(RESPONSE_CODES.OK).render ('users/checkout' , {
            cart,grandTotal,addressData ,userData,
            shipping,
            totalAmount,
            totalQuantity,
            coupons,couponVal
        }
        )
        }

        catch(error){
            console.log(error)
            res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/admin/internal-server-error')
        }
        }


module.exports = {viewCart,addToCart,removeFromCart,checkout,cartCheck,
    
}