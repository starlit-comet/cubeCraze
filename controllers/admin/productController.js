const productSchema = require('../../models/productSchema')
const categorySchema = require('../../models/categorySchema')
const brandSchema = require('../../models/brandSchema')
const sizeSchema = require('../../models/sizeSchema')
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require('../../utils/responseMessages')

const viewProducts = async (req,res)=>{
    let currentPage = parseInt(req.query.page,10) || 1
    if(currentPage<1) currentPage=1
    let totalPages , limit = 5,totalItems
    let allProducts = await productSchema.find({})
    totalItems = allProducts.length
     totalPages = Math.ceil(allProducts.length / limit)
    const productData = await productSchema.find({})
    .sort({createdAt:-1})
    .skip((currentPage-1)*limit)
    .limit(limit)
    .populate([
        { path: 'brand' },
        { path: 'category' },
        { path: 'size' },
    ]   )
    res.status(RESPONSE_CODES.OK).render('admin/products',{productData,totalItems,totalPages,currentPage,limit})
}

const addProduct = async (req,res)=>{
    try {
        const { productName, description, regularPrice, promotionalPrice, brand, category, cubeSize,productQuantity } = req.body;
        if (!productName || !description || !regularPrice || !brand || !category || !cubeSize ||!productQuantity  ) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ success: false, message:MESSAGES.ALL_FIELDS_ARE_REQUIRED });
        }
        if(productQuantity<5)return res.status(RESPONSE_CODES.BAD_REQUEST).json({message:MESSAGES.MINIMUN_QUANTIY_NOT_ACHIEVED})

        if (!req.files || req.files.length <3) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.MINIMUM_THREE_IMAGES_REQUIRED });
        }

        const imageUrls = req.files.map(file => file.path); // Extract Cloudinary URLs
        let productOffer = ((regularPrice-promotionalPrice)/regularPrice)*100
        productOffer = Math.floor(productOffer)
        if(productOffer < 0 || productOffer > 100) productOffer = 0
        const newProduct = new productSchema({
            productName,  description, regularPrice,
            promotionalPrice,  brand,  category, productOffer,
            size:cubeSize,  productImages: imageUrls,quantity:productQuantity
        });
        console.log(newProduct)
       await newProduct.save();
        res.status(RESPONSE_CODES.OK).json({ success: true, message: MESSAGES.PRODUCT_ADDED_SUCCESSFULLY  });
        

    } catch (error) {
        console.error(error);
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const viewEditProduct = async (req,res)=>{
    try {
        const productId  = req.params.productId;
        const productExists = await productSchema.exists({_id:productId})
        if(!productExists) return res.redirect('/admin/page-not-found')

        const productData = await productSchema.findById(productId).populate([
            { path: 'brand' },
            { path: 'category' },
            { path: 'size' },
        ]   );
        const activeBrandNames = await brandSchema.find({isBlocked:false, _id:{$ne:productData.brand._id} },'brandName')
        const activeCategories = await categorySchema.find({isListed:true,_id:{$ne:productData.category._id} },'categoryName')
        const cubeSizes = await sizeSchema.find({_id:{$ne:productData.size._id} },'size')
        res.render('admin/editProduct',{productData,activeBrandNames,activeCategories,cubeSizes})
}       
catch (error) {
    console.log(error)
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/admin/internal-server-error')
}}


const editProduct= async (req,res)=>{
   try {
    const {productId,productName, description, regularPrice, promotionalPrice, brand, category, cubeSize,productQuantity} = req.body
    const product = await productSchema.findById(productId)

    let updatedFields = {}; // Store only changed fields

    // 3️⃣ Check for modified fields
    
    if (product.productName !== productName.trim()) updatedFields.productName = productName;
    if (product.description !== description.trim()) updatedFields.description = description;
    if (product.regularPrice !== 1*regularPrice) updatedFields.regularPrice = 1*regularPrice;
    if (product.promotionalPrice !== 1*promotionalPrice) updatedFields.salePrice =1*promotionalPrice;
    if (product.quantity !== 1*productQuantity) updatedFields.quantity =1* productQuantity;
    
    if (brand) updatedFields.brand=brand
    if (category) updatedFields.category=category
    if (cubeSize) updatedFields.size=cubeSize
    const isEmpty = Object.entries(updatedFields).length 
    if(isEmpty === 0 ){
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.NO_EDIT_IN_PRODUCT_DATA });
        
    }
    updatedFields.updatedAt = new Date()
    if(1*productQuantity<0) return res.status(RESPONSE_CODES.BAD_REQUEST).json({success:false,message: MESSAGES.QUANTITY_CANNOT_BE_LESSTHAN_0 })
    const updatedProduct = await productSchema.findByIdAndUpdate(productId,
        updatedFields,{new:true},
    )
    return res.status(RESPONSE_CODES.OK).json({ success: true, message: MESSAGES.PRODUCT_EDITED });
} catch (error) {
    
   }
}


const viewAddProductPage=  async (req,res)=>{
    try{
    const activeBrandNames = await brandSchema.find({isBlocked:false},'brandName')
    const activeCategories = await categorySchema.find({isListed:true},'categoryName')
    const cubeSizes = await sizeSchema.find({},'size')
    res.render('admin/addProduct',{activeBrandNames,activeCategories,cubeSizes})
} catch(err){
    console.log(error) 
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR)
}}

const deleteProduct = async (req,res)=> {
    try {
        const productId = req.params.id
        const productExists = await productSchema.exists({_id:productId})
        if(!productExists) return res.redirect('/admin/page-not-found')
        await productSchema.findByIdAndUpdate(productId,{isBlocked:true})
        res.status(RESPONSE_CODES.OK).json({success:true})
    } catch (error) {
        res.status(RESPONSE_CODES.NOT_FOUND).json({success:false})   
    }
}
const changeStatus=async (req,res)=>{
    try {
        const productId = req.params.id
        const {changeStatusTo} = req.body
        const productExists = await productSchema.exists({_id:productId})
        if(!productExists) return res.redirect('/admin/page-not-found')

        await productSchema.findByIdAndUpdate(productId,{isBlocked:changeStatusTo})
        res.status(RESPONSE_CODES.OK).json({success:true})
    } catch (error) {
        res.status(RESPONSE_CODES.BAD_REQUEST).json({success:false})
    }
}

const removeProductImage = async(req,res)=>{
    const {imgLink,productId} =req.body

   const product = await productSchema.findByIdAndUpdate(productId,{$pull:{productImages:imgLink}},{new:true})
}

module.exports={addProduct,viewProducts,viewAddProductPage,viewEditProduct,editProduct,
                    deleteProduct,changeStatus,removeProductImage
}