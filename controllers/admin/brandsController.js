const brandsSchema = require('../../models/brandSchema')
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require('../../utils/responseMessages')

const viewBrands = async (req,res)=>{
    try{
    let totalItems,currentPage,totalPages,limit =5
    currentPage = parseInt(req.query.page,10) || 1
    if(currentPage<1) currentPage = 1
    let allProducts = await brandsSchema.find({})
    totalItems = allProducts.length
    totalPages = Math.ceil(totalItems / limit)
    const brandsData = await brandsSchema.find({})
    .sort({createdAt:-1})
    .skip((currentPage-1)*limit)
    .limit(limit)
res.render('admin/brands',{brandsData,totalItems,currentPage,totalPages,limit})
} catch(err){
    console.log(err)
    return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message:MESSAGES.INTERNAL_SERVER_ERROR})
}}


const addBrand=async (req,res)=>{
    try {
        const { brandName ,brandDescription ,brandOffer} = req.body;
        const brandImage = req.file.path
       
        if (!brandName || !brandImage) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message:MESSAGES.BRAND_NAME_AND_IMAGE_ARE_REQUIRED ,result:{isConfirmed:true} });
        }
        const isBrandAvailabe = await brandsSchema.findOne({brandName})
        
        if(isBrandAvailabe){
            console.log(`the brand tried to add already exists `)
             return res.status(RESPONSE_CODES.BAD_REQUEST).json({message:MESSAGES.BRAND_NAME_ALREADY_EXISTS,isconfirmed:false})
        }
             const newBrand = new brandsSchema({ brandName, brandImage,brandDescription,brandOffer });
        await newBrand.save();
        console.log(`new Brand added`)
        res.status(RESPONSE_CODES.CREATED).json({ message: `New "${brandName}" Brand added successfully` ,isConfirmed:true });
    } catch (error) {
        console.error("Error adding brand:", error);
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

module.exports={viewBrands,addBrand}