const mongoose = require('mongoose')
const userSchema = require('../../models/userSchema')
const productSchema = require("../../models/productSchema")
const sizeSchema = require('../../models/sizeSchema')
const brandSchema = require('../../models/brandSchema')
const categorySchema = require('../../models/categorySchema')
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require ('../../utils/responseMessages')

const viewProduct = async (req,res)=>{
  try
  { 
    let search = req.query.search ?? "";
    const productId = req.params.productId
     if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).redirect('/pagenotfound');
        }
        const productExist = await productSchema.exists({_id:productId})
        if(!productExist) return res.status(RESPONSE_CODES.NOT_FOUND).redirect('/pagenotfound')

     const allCategories = await categorySchema.find({isListed:true})
     const allBrands = await brandSchema.find({isBlocked:false})
     const allSizes = await sizeSchema.find()
     
    
     const productData = await productSchema.findById(productId).populate([
        { path: 'brand' },
        { path: 'category' },
        { path: 'size' },
     ])
    res.status(RESPONSE_CODES.OK).render('users/viewProduct',{productData,allCategories,allBrands,allSizes,
       minPrice:0, maxPrice:7500,
         searchKeyWord:search ,
    })
}
catch(error){
    console.log(error)
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/pagenotfound')

}}

const viewWishList = async (req,res)=>{

    const userId = req.session._id
    const wishListData = await userSchema.findById(userId).select('wishList -_id')
    const data = await Promise.all(
        wishListData.wishList.map(item => productSchema.findById(item).populate([
                 { path: 'brand' },
                 { path: 'category' },
                 { path: 'size' },
        ]))
    );
    res.render('users/wishList',{
        data,
        searchKeyWord :'',
        minPrice: 0,
        maxPrice:7500,
    })
}

const removeFromWishList= async (req,res)=>{
    try {
        const {productId} = req.body
        const userId = req.session._id

        if(!userId) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.USER_NOT_AUTHENTICATED })

        const updatedUser = await userSchema.findByIdAndUpdate(userId,
            {$pull:{wishList : productId }}, {new:true}
        )
        if(!updatedUser) await res.status(RESPONSE_CODES.NOT_FOUND).json({message: MESSAGES.USER_NOT_FOUND_WHILE_REMOVING_PRODUCT })

        return res.status(RESPONSE_CODES.OK).json({
            message:MESSAGES.PRODUCT_REMOVED_SUCCESSFULLY
        })
    } catch (error) {
        console.log(error)
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message:MESSAGES.INTERNAL_SERVER_ERROR})
        
    }
}

const addtoWishList = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session._id;

        if (!userId) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.USER_NOT_AUTHENTICATED });
        }

        const user = await userSchema.findById(userId);
        if (!user) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.USER_NOT_FOUND });
        }

        // Check if the product is already in the wishlist
        const isProductInWishlist = user.wishList.includes(productId);
        const isProductInCart = user.cart.some(item=>item.productId.toString()===productId)
        if (isProductInWishlist) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.PRODUCT_ALREADY_IN_WISHLIST });
        } 
        if (isProductInCart) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.PRODUCT_ALREADY_IN_CART });
        } 
        
        // Add to wishlist if not present
        const updatedUser=await userSchema.findByIdAndUpdate(userId, { $push: { wishList: productId } },{new:true});

        return res.status(RESPONSE_CODES.OK).json({ message: MESSAGES.PRODUCT_ADDED_TO_WISHLIST ,success:true});

    } catch (error) {
        console.error('Error in wishlist:', error);
        return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const  increaseQuantity = async (req,res)=>{
   try{ const productId = req.body.productId
    const userId = req.session._id

    if(!userId) return res.status(RESPONSE_CODES.UNAUTHORIZED).json({message:MESSAGES.UNAUTHORIZED})

    const user = await userSchema.findById(userId)
    if(!user) return res.status(RESPONSE_CODES.NOT_FOUND).json({message:MESSAGES.USER_NOT_FOUND })
    const cartItem = user.cart.find(item=>
        item.productId.toString() === productId
    )
    if(!cartItem) return res.status(RESPONSE_CODES.NOT_FOUND).json({message: MESSAGES.PRODUCT_NOT_FOUND_IN_CART})
    cartItem.quantity+=1
    let stock = await productSchema.findById(cartItem.productId).select('quantity -_id')
    if(cartItem.quantity > stock.quantity) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message:MESSAGES.REQUESTED_QUANTITY_IS_NOT_AVAILABLE ,reload:true})
    if(cartItem.quantity >10) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.PRODUCT_QUANTITY_CANNOT_BE_MORE_THAN_10  ,reload:true})
    await user.save()
    return res.status(RESPONSE_CODES.OK).json({message:`Quantity Increased to ${cartItem.quantity}`,success:true,value:cartItem.quantity})
}
catch(error){
    console.log(error)
    return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message:MESSAGES.INTERNAL_SERVER_ERROR})
}}

const decreaseQuantity = async (req,res)=>{
    try{ const productId = req.body.productId
        const userId = req.session._id
    
        if(!userId) return res.status(RESPONSE_CODES.UNAUTHORIZED).json({message:MESSAGES.UNAUTHORIZED})
    
        const user = await userSchema.findById(userId)
        if(!user) return res.status(RESPONSE_CODES.NOT_FOUND).json({message:MESSAGES.USER_NOT_FOUND})
        console.log(user.cart)
        const cartItem = user.cart.find(item=>
            item.productId.toString() === productId
        )
        if(!cartItem) return res.status(RESPONSE_CODES.NOT_FOUND).json({message: MESSAGES.PRODUCT_NOT_FOUND_IN_CART })
        cartItem.quantity-=1
        if(cartItem.quantity <1 ) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.PRODUCT_QUANTITY_CANNOT_BE_LESSTHAN_1 })
        await user.save()
        return res.status(RESPONSE_CODES.OK).json({message:`Quantity Decreased to ${cartItem.quantity}`,success:true,value:cartItem.quantity})
    }
    catch(error){
        console.log(error)
        return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message: MESSAGES.INTERNAL_SERVER_ERROR })
    }
}

const sendCartAndWishlistData = async (req,res)=>{
    try {
        const userId = req.session._id
        const user = await userSchema.findById(userId)
        if(!user) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message: MESSAGES.USER_NOT_FOUND })
        const wishList =await Promise.allSettled( user.wishList.map( item=>{
                const data =  productSchema.findById(item)
                return data
        }))

        const cart = await Promise.allSettled( user.cart.map(item=>{
            const data = productSchema.findById(item.productId)
                return data
            
        }) )
        res.status(RESPONSE_CODES.OK).json({wishList,cart})
    } catch (error) {
        console.log('error in sending data of wishlist and cart',error)
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message:MESSAGES.INTERNAL_SERVER_ERROR})
    }

}


module.exports={viewProduct,viewWishList,removeFromWishList,addtoWishList,
    increaseQuantity,decreaseQuantity,sendCartAndWishlistData}