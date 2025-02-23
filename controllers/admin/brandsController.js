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
        const { brandName ,brandDescription } = req.body;
        const brandImage = req.file.path
       
        if (!brandName || !brandImage) {
            return res.status(400).json({ message: "Brand name and image are required",result:{isConfirmed:true} });
        }
        const isBrandAvailabe = await brandsSchema.findOne({brandName})
        
        if(isBrandAvailabe){
            console.log(`the brand tried to add already exists `)
             return res.status(201).json({message:"BrandName Already Exists",isconfirmed:false})
        }
             const newBrand = new brandsSchema({ brandName, brandImage,brandDescription });
        await newBrand.save();
        console.log(`new Brand added`)
        res.status(201).json({ message: `New "${brandName}" Brand added successfully` ,isConfirmed:true });
    } catch (error) {
        console.error("Error adding brand:", error);
        res.status(500).json({ message: "Server error" });
    }
    

}

module.exports={viewBrands,addBrand}