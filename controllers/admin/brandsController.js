const brandsSchema = require('../../models/brandSchema')

// const multer = require('multer')
// const cloudinary = require('../../config/cloudinary')

// const storage=multer.diskStorage({});
// const upload = multer({storage})

const viewBrands = async (req,res)=>{

    const brandsData = await brandsSchema.find({})
res.render('admin/brands',{brandsData})
}


const addBrand=async (req,res)=>{
    try {
        const { brandName } = req.body;
        const brandImage = req.file ? `/uploads/${req.file.filename}` : null;

        if (!brandName || !brandImage) {
            return res.status(400).json({ message: "Brand1 name and image are required",result:{isConfirmed:true} });
        }
        const isBrandAvailabe = await brandsSchema.findOne({brandName})
        console.log(`hi ${isBrandAvailabe}`)
        if(isBrandAvailabe){
             return res.status(201).json({message:"BrandName Already Exists"})
        }
             const newBrand = new brandsSchema({ brandName, brandImage });
        await newBrand.save();

        res.status(201).json({ message: "Brand added successfully", brand: newBrand });
    } catch (error) {
        console.error("Error adding brand:", error);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports={viewBrands,addBrand}