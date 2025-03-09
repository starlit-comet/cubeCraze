const userSchema = require('../../models/userSchema')
const productSchema = require("../../models/productSchema")
const sizeSchema = require('../../models/sizeSchema')
const brandSchema = require('../../models/brandSchema')
const categorySchema = require('../../models/categorySchema')
//const adressSchema = require()
//const { search } = require("../../routes/user")
const viewProduct = async (req,res)=>{
  try
  { //const productId = '67c0cb99a2f30570cddcd306'
    let search = req.query.search ?? "";

     const productId = req.params.productId
     const allCategories = await categorySchema.find({isListed:true})
     const allBrands = await brandSchema.find({isBlocked:false})
     const allSizes = await sizeSchema.find()
     
    
     const productData = await productSchema.findById(productId).populate([
        { path: 'brand' },
        { path: 'category' },
        { path: 'size' },
     ])
     //console.log(productData)
    res.render('users/viewProduct',{productData,allCategories,allBrands,allSizes,
       minPrice:0, maxPrice:7500,
         searchKeyWord:search ,
    })
}
catch(error){
    console.log(error)
    res.status(500).redirect('/pagenotfound')

}}

const viewWishList = async (req,res)=>{
    // const userId = '67c81140c0b9a2f078c05b68'
    // req.session._id= userId

    const userId = req.session._id
    const wishListData = await userSchema.findById(userId).select('wishList -_id')
        console.log(userId,wishListData)
    const data = await Promise.all(
        wishListData.wishList.map(item => productSchema.findById(item).populate([
                 { path: 'brand' },
                 { path: 'category' },
                 { path: 'size' },
        ]))
    );
   // console.log(data)
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

        if(!userId) return res.status(400).json({message:'User not Authenticated'})

        const updatedUser = await userSchema.findByIdAndUpdate(userId,
            {$pull:{wishList : productId }}, {new:true}
        )
        if(!updatedUser) await res.status(404).json({message:'User Not found while removing Product'})

        return res.status(200).json({
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
            return res.status(400).json({ message: 'User not authenticated' });
        }

        const user = await userSchema.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the product is already in the wishlist
        const isProductInWishlist = user.wishList.includes(productId);

        if (isProductInWishlist) {
            return res.status(200).json({ message: 'Product already in wishlist' });
        } 
        
        // Add to wishlist if not present
        await userSchema.findByIdAndUpdate(userId, { $push: { wishList: productId } });

        return res.status(200).json({ message: 'Product added to wishlist' });

    } catch (error) {
        console.error('Error in wishlist:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports={viewProduct,viewWishList,removeFromWishList,addtoWishList}