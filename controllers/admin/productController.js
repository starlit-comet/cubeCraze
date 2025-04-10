const productSchema = require('../../models/productSchema')
const categorySchema = require('../../models/categorySchema')
const brandSchema = require('../../models/brandSchema')
const sizeSchema = require('../../models/sizeSchema')

const viewProducts = async (req,res)=>{
    const productData = await productSchema.find({}).populate([
        { path: 'brand' },
        { path: 'category' },
        { path: 'size' },
    ]   )
    res.render('admin/products',{productData})
}

const addProduct = async (req,res)=>{
    try {
        console.log(req.body)
        const { productName, description, regularPrice, promotionalPrice, brand, category, cubeSize,productQuantity } = req.body;
        if (!productName || !description || !regularPrice || !brand || !category || !cubeSize ||!productQuantity  ) {
            return res.status(400).json({ success: false, message: "All required fields must be filled!" });
        }
        if(productQuantity<5)return res.status(400).json({message:'Minimum Quanity of 5 is needed to add a product'})

        if (!req.files || req.files.length <3) {
            return res.status(400).json({ success: false, message: "Minimum Three Images are required" });
        }

        const imageUrls = req.files.map(file => file.path); // Extract Cloudinary URLs

        const newProduct = new productSchema({
            productName,  description, regularPrice,
            promotionalPrice,  brand,  category,
            size:cubeSize,  productImages: imageUrls,quantity:productQuantity
        });

        await newProduct.save();
        res.json({ success: true, message: "Product added successfully!" });
        console.log("New Product Added Successfull")
        

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

const viewEditProduct = async (req,res)=>{
    try {
        const productId  = req.params.productId;
        const productExists = await productSchema.exists({_id:productId})
        console.log(productExists,'product find sttauts')
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
}


}


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
        return res.status(400).json({ success: false, message:"No Edit in Product Data found" });
        
    }
    updatedFields.updatedAt = new Date()
    if(1*productQuantity<0) return res.status(400).json({success:false,message:" Quantity can't be less than 0 "})
    const updatedProduct = await productSchema.findByIdAndUpdate(productId,
        updatedFields,{new:true},
    )
    console.log(`Edit Product Success` ,updatedFields)
    return res.status(200).json({ success: true, message: "Product Edited" });
} catch (error) {
    
   }
}


const viewAddProductPage=  async (req,res)=>{
    const activeBrandNames = await brandSchema.find({isBlocked:false},'brandName')
    const activeCategories = await categorySchema.find({isListed:true},'categoryName')
    const cubeSizes = await sizeSchema.find({},'size')
    res.render('admin/addProduct',{activeBrandNames,activeCategories,cubeSizes})
}

const deleteProduct = async (req,res)=> {
    try {
        const productId = req.params.id
        const productExists = await productSchema.exists({_id:productId})
        if(!productExists) return res.redirect('/admin/page-not-found')
        await productSchema.findByIdAndUpdate(productId,{isBlocked:true})
        console.log('product Deleted (blocked)')
        res.status(200).json({success:true})
    } catch (error) {
        res.status(404).json({success:false})   
    }
}
const changeStatus=async (req,res)=>{
    try {
        const productId = req.params.id
        const {changeStatusTo} = req.body
        const productExists = await productSchema.exists({_id:productId})
        if(!productExists) return res.redirect('/admin/page-not-found')

        await productSchema.findByIdAndUpdate(productId,{isBlocked:changeStatusTo})
        res.status(200).json({success:true})
        console.log(`Product Status changed`)
    } catch (error) {
        res.status(400).json({success:false})
    }
}

const removeProductImage = async(req,res)=>{
    const {imgLink,productId} =req.body
   console.log(imgLink,productId)

   const product = await productSchema.findByIdAndUpdate(productId,{$pull:{productImages:imgLink}},{new:true})
   console.log(product)
}

module.exports={addProduct,viewProducts,viewAddProductPage,viewEditProduct,editProduct,
                    deleteProduct,changeStatus,removeProductImage
}