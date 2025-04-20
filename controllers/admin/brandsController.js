const brandsSchema = require('../../models/brandSchema')
const responseCodes = require('../../helpers/StatusCodes')

const viewBrands = async (req,res)=>{

    const brandsData = await brandsSchema.find({})
res.render('admin/brands',{brandsData})
}


const addBrand=async (req,res)=>{
    try {
        const { brandName ,brandDescription ,brandOffer} = req.body;
        const brandImage = req.file.path
       
        if (!brandName || !brandImage) {
            return res.status(responseCodes.BAD_REQUEST).json({ message: "Brand name and image are required",result:{isConfirmed:true} });
        }
        const isBrandAvailabe = await brandsSchema.findOne({brandName})
        
        if(isBrandAvailabe){
            console.log(`the brand tried to add already exists `)
             return res.status(responseCodes.BAD_REQUEST).json({message:"BrandName Already Exists",isconfirmed:false})
        }
             const newBrand = new brandsSchema({ brandName, brandImage,brandDescription,brandOffer });
        await newBrand.save();
        console.log(`new Brand added`)
        res.status(responseCodes.CREATED).json({ message: `New "${brandName}" Brand added successfully` ,isConfirmed:true });
    } catch (error) {
        console.error("Error adding brand:", error);
        res.status(responseCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
    }
}

module.exports={viewBrands,addBrand}