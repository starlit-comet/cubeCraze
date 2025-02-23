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
        const { productName, description, regularPrice, promotionalPrice, brand, category, cubeSize,productQuantity } = req.body;
      // console.log(productQuantity,description)
        if (!productName || !description || !regularPrice || !brand || !category || !cubeSize ||!productQuantity  ) {
            return res.status(400).json({ success: false, message: "All required fields must be filled123!" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "At least one image is required!" });
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


const viewAddProductPage=  async (req,res)=>{
    const activeBrandNames = await brandSchema.find({isBlocked:false},'brandName')
    const activeCategories = await categorySchema.find({isListed:true},'categoryName')
    const cubeSizes = await sizeSchema.find({},'size')
    res.render('admin/addProduct',{activeBrandNames,activeCategories,cubeSizes})
}

module.exports={addProduct,viewProducts,viewAddProductPage,viewEditProduct}