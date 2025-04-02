const productSchema = require("../../models/productSchema")
const sizeSchema = require('../../models/sizeSchema')
const brandSchema = require('../../models/brandSchema')
const categorySchema = require('../../models/categorySchema')

const getCategoriesIdByName = async (arrayOfNames)=>{
    const categories= await categorySchema .find({ categoryName : { $in : arrayOfNames }, isListed:true})

    return categories.map(category => category._id)
}

const getBrandsIdByName = async (arrayOfNames)=>{
    const brands= await brandSchema .find({ brandName : { $in : arrayOfNames }, isBlocked:false})

    return brands.map(brand => brand._id)
}

const viewShop = async (req, res) => {
    try {
        // Extract query parameters
       // console.log('queries',req.query.brand,req.query.category)
        let categoryName = req.query.category ? req.query.category.split(','): []
        let brandName = req.query.brand ? req.query.brand.split(',') : []
        let search = req.query.search ?? "";
        let page = parseInt(req.query.page, 10) || 1; // Ensure `page` is a number, default to 1
        if(page<1) page =1
        let limit = req.query.limit || 10;
        limit = limit === "all" ? 0 : parseInt(limit, 10) || 10; // Default limit is 10
        let sort = req.query.sort || 'Aa-Zz';
       // console.log(brandName,categoryName,search,' 3 values')
        // Extract price filter
        let minPrice = req.query.minPrice|| 0; // Default min price
        let maxPrice = req.query.maxPrice || 7500; // Default max price

      
        // Sorting logic mapping
        const sortOptions = {
            'Zz-Aa': { productName: -1 },
            'Aa-Zz': { productName: 1 },
            "featured": { featured: -1 },
            "price-asc": { promotionalPrice: 1 },
            "price-desc": { promotionalPrice: -1 },
            "latest": { createdAt: -1 }
        };

        const sortQuery = sortOptions[sort] || { createdAt: -1 };

        // Fetch filter options
        const allSizes = await sizeSchema.find();
        const allCategories = await categorySchema.find({ isListed: true });
        const allBrands = await brandSchema.find({ isBlocked: false });

        // Build query for products
        let query = {
            isBlocked: false,
            promotionalPrice: { $gte: minPrice, $lte: maxPrice }, // Apply price filtering
            $or: [
                { productName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ] 
        };

        if(categoryName.length>0) query.category={ $in : await getCategoriesIdByName(categoryName)}
        if(brandName.length >0) query.brand = { $in : await getBrandsIdByName (brandName)}
        // Get total count before pagination
        const totalProducts = await productSchema.countDocuments(query);

       // console.log('query',query)
        // Apply sorting, pagination, and filtering
        let allProducts = await productSchema.find(query)
            .sort(sortQuery)
            .skip((page - 1) * limit) // Skip items for pagination
            .limit(limit || undefined) // If limit = 0, fetch all
            .populate([
                { path: 'brand' },
                { path: 'category' },
                { path: 'size' }
            ]);

        // Filter out blocked brands/categories before sending response
        allProducts = allProducts.filter(item => !item.brand.isBlocked && item.category.isListed);
            // if(brandName) allProducts= allProducts.filter(item => item.brand.brandName == brandName)
            // if(categoryName)allProducts= allProducts.filter(item => item.category.categoryName == categoryName)
           //     console.log(allProducts,'shoep controller')
        // Render shop page with data
        req.query.search = search
        res.render("users/shop", { 
            allProducts,
            allBrands,
            allCategories,
            allSizes,
            totalProducts,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            limit,
            sort,
            minPrice,
            maxPrice,
            searchKeyWord:search,
        });
       // console.log('sending data ',totalProducts,page,limit,sort,minPrice,maxPrice,search)
       // console.log(search)
    } catch (error) {
        console.error(error);
        res.status(500).redirect("/pagenotfound"); 
    }
};

// const viewShop = async (req,res)=>{
//     const { brands,categories,sizes,minPrice,maxPrice,
//             sortBy = 'date',
//             sortOrder = 'desc',
//             search = '',
//             page = 1,
//             pageSize = 10,

//     } = req.query

//     const filter ={}
//     if
// }

const loadHome = async(req,res)=>{
    try {
        let search = req.query.search ?? "";
        const productId='67c3d742cbe4aa0e478180c5'
        latestProduct = await productSchema.findById(productId)
        //console.log(latestProduct)
        const userData = req.session.user
        res.render('users/userHome',{userData,latestProduct,searchKeyWord:search
        })
    } catch (error) {
        console.log(error)
       // res.status(500).send('PageNotFound')
        res.status(500).redirect('/pagenotfound')

    }
}
module.exports={viewShop,loadHome}