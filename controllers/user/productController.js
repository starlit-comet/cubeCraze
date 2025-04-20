const mongoose = require('mongoose')
const userSchema = require('../../models/userSchema')
const productSchema = require("../../models/productSchema")
const sizeSchema = require('../../models/sizeSchema')
const brandSchema = require('../../models/brandSchema')
const categorySchema = require('../../models/categorySchema')
const responseCodes = require('../../helpers/StatusCodes')

const viewProduct = async (req,res)=>{
  try
  { 
    let search = req.query.search ?? "";
    const productId = req.params.productId
     if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(responseCodes.BAD_REQUEST).redirect('/pagenotfound');
        }
        const productExist = await productSchema.exists({_id:productId})
        if(!productExist) return res.status(responseCodes.NOT_FOUND).redirect('/pagenotfound')

     const allCategories = await categorySchema.find({isListed:true})
     const allBrands = await brandSchema.find({isBlocked:false})
     const allSizes = await sizeSchema.find()
     
    
     const productData = await productSchema.findById(productId).populate([
        { path: 'brand' },
        { path: 'category' },
        { path: 'size' },
     ])
    res.render('users/viewProduct',{productData,allCategories,allBrands,allSizes,
       minPrice:0, maxPrice:7500,
         searchKeyWord:search ,
    })
}
catch(error){
    console.log(error)
    res.status(responseCodes.INTERNAL_SERVER_ERROR).redirect('/pagenotfound')

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

        if(!userId) return res.status(responseCodes.BAD_REQUEST).json({message:'User not Authenticated'})

        const updatedUser = await userSchema.findByIdAndUpdate(userId,
            {$pull:{wishList : productId }}, {new:true}
        )
        if(!updatedUser) await res.status(responseCodes.NOT_FOUND).json({message:'User Not found while removing Product'})

        return res.status(responseCodes.OK).json({
            message:'product removed succesfully'
        })
    } catch (error) {
        
    }
}

const addtoWishList = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session._id;

        if (!userId) {
            return res.status(responseCodes.BAD_REQUEST).json({ message: 'User not authenticated' });
        }

        const user = await userSchema.findById(userId);
        if (!user) {
            return res.status(responseCodes.NOT_FOUND).json({ message: 'User not found' });
        }

        // Check if the product is already in the wishlist
        const isProductInWishlist = user.wishList.includes(productId);
        const isProductInCart = user.cart.some(item=>item.productId.toString()===productId)
        if (isProductInWishlist) {
            return res.status(responseCodes.NOT_FOUND).json({ message: 'Product already in wishlist' });
        } 
        if (isProductInCart) {
            return res.status(responseCodes.BAD_REQUEST).json({ message: 'Product already in Cart' });
        } 
        
        // Add to wishlist if not present
        const updatedUser=await userSchema.findByIdAndUpdate(userId, { $push: { wishList: productId } },{new:true});

        return res.status(responseCodes.OK).json({ message: 'Product added to wishlist' ,success:true});

    } catch (error) {
        console.error('Error in wishlist:', error);
        return res.status(responseCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
    }
};

const  increaseQuantity = async (req,res)=>{
   try{ const productId = req.body.productId
    const userId = req.session._id

    if(!userId) return res.status(responseCodes.UNAUTHORIZED).json({message:'Unauthorised'})

    const user = await userSchema.findById(userId)
    if(!user) return res.status(responseCodes.NOT_FOUND).json({message:'User Not Found'})
    const cartItem = user.cart.find(item=>
        item.productId.toString() === productId
    )
    if(!cartItem) return res.status(responseCodes.NOT_FOUND).json({message:"Product Not found in Cart"})
    cartItem.quantity+=1
    let stock = await productSchema.findById(cartItem.productId).select('quantity -_id')
    if(cartItem.quantity > stock.quantity) return res.status(responseCodes.BAD_REQUEST).json({message:`This much of quantity is not availabe in Stock`,reload:true})
    if(cartItem.quantity >10) return res.status(responseCodes.BAD_REQUEST).json({message:'Product Quantity Cannot be added more than 10',reload:true})
    await user.save()
    return res.status(responseCodes.OK).json({message:`Quantity Increased to ${cartItem.quantity}`,success:true,value:cartItem.quantity})
}
catch(error){
    console.log(error)
    return res.status(responseCodes.INTERNAL_SERVER_ERROR).json({message:'Internal Server ErrorOccured!!'})
}}

const decreaseQuantity = async (req,res)=>{
    try{ const productId = req.body.productId
        const userId = req.session._id
    
        if(!userId) return res.status(responseCodes.UNAUTHORIZED).json({message:'Unauthorised'})
    
        const user = await userSchema.findById(userId)
        if(!user) return res.status(responseCodes.NOT_FOUND).json({message:'User Not Found'})
        console.log(user.cart)
        const cartItem = user.cart.find(item=>
            item.productId.toString() === productId
        )
        if(!cartItem) return res.status(responseCodes.NOT_FOUND).json({message:"Product Not found in Cart"})
        cartItem.quantity-=1
        if(cartItem.quantity <1 ) return res.status(responseCodes.BAD_REQUEST).json({message:'Product Quantity Cannot be less than 1'})
        await user.save()
        return res.status(responseCodes.OK).json({message:`Quantity Decreased to ${cartItem.quantity}`,success:true,value:cartItem.quantity})
    }
    catch(error){
        console.log(error)
        return res.status(responseCodes.INTERNAL_SERVER_ERROR).json({message:'Internal Server ErrorOccured!!'})
    }
}

const sendCartAndWishlistData = async (req,res)=>{
    try {
        const userId = req.session._id
        const user = await userSchema.findById(userId)
        if(!user) return res.status(responseCodes.BAD_REQUEST).json({message:'user not found 123'})
        const wishList =await Promise.allSettled( user.wishList.map( item=>{
                const data =  productSchema.findById(item)
                return data
        }))

        const cart = await Promise.allSettled( user.cart.map(item=>{
            const data = productSchema.findById(item.productId)
                return data
            
        }) )
        res.status(responseCodes.OK).json({wishList,cart})
    } catch (error) {
        console.log('error in sending data of wishlist and cart',error)
    }

}


module.exports={viewProduct,viewWishList,removeFromWishList,addtoWishList,
    increaseQuantity,decreaseQuantity,sendCartAndWishlistData}