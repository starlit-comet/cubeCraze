const userSchema = require('../../models/userSchema')
const productSchema = require ('../../models/productSchema')

const viewCart = async (req,res)=>{
try{
const userId = req.session._id
const cartItems = await userSchema.findById(userId).select('cart -_id')
//console.log(cartItems)
let cart = []
for(let item of cartItems.cart){
    let product = await productSchema.findById(item.productId).populate([
        { path: 'brand' },
        { path: 'category' },
        { path: 'size' },
    ]).lean()
    //console.log(item.quantity)
    Object.assign(product,{cartQuantity:item.quantity})
   // product.cartQuantity = item.quantity
    cart.push(product)
}
 console.log(cart)
res.render('users/cart',{cart,searchKeyWord:'',minPrice:0,maxPrice:7500})
}
catch(error){
    console.log(error)
}
}

const addToCart = async (req,res)=>{
try {
   // let quantityToAdd = 1
    const {productId,quantityToAdd} = req.body
    //console.log(typeof(quantityToAdd))
    const userId = req.session._id
    const user = await userSchema.findById(userId)
    //console.log('userData',user)
    const existingItemIndex = user.cart.findIndex(item => 
        item.productId.toString() === productId
    );
    if(user.cart[existingItemIndex] && user.cart[existingItemIndex].quantity + 1* quantityToAdd >10){
        return res.status(400).json({
            message: `Product Already in cart, Total  quantity of the product  exceeds maximum limit of 10. kindly reduce the quantity to max ${10-user.cart[existingItemIndex].quantity}`,
            status:'updated'
            })
    }
    else if (existingItemIndex > -1) {
        // If exists, increment the quantity (or replace quantity)
        let countOfQuantity = user.cart[existingItemIndex].quantity += 1* quantityToAdd;
        user.wishList.pull(productId)

        await user.save();

        return res.status(200).json({
        message: `Product Already in cart, Hence quantity of the product is increased to ${countOfQuantity}`,
        status:'updated'
        })
    } else {
        // If not exists, push a new entry
        user.cart.push({ productId, quantity: quantityToAdd })
        user.wishList.pull(productId)
        await user.save();
        
        return res.status(200).json({message:'Product Added to Cart',status:"Added"});
    }

    console.log(productId,user)
} catch (error) {
    console.log(error)
    return res.status(500).json({
        message:'An Error Occured while adding to Cart',
        Status:'Error'
    })
}
}

module.exports = {viewCart,addToCart}