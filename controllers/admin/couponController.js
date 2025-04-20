const couponSchema = require('../../models/referalCouponSchema')
const codeGenerator = require('../../helpers/generateUniquesVal')
const responseCodes = require('../../helpers/StatusCodes')


const addNewCoupon = async (req, res) => {
    try {
        let newCouponCode = await codeGenerator.generateUniqueCode();
        const { name, discountType, discountValue, minPurchase, maxDiscount, startsAt, expiresAt } = req.body;

        if (!name || !discountType || !discountValue || !expiresAt) {
            return res.status(responseCodes.BAD_REQUEST).json({ success: false, message: "All required fields must be filled" });
        }

        if (discountType === 'percentage' && discountValue > 100) {
            return res.status(responseCodes.BAD_REQUEST).json({ success: false, message: "Percentage discount cannot exceed 100%" });
        }

        let newCoupon = new couponSchema({
            name,
            code: newCouponCode,
            discountType,
            discountValue,
            minPurchase,
            maxDiscount: discountType === 'percentage' ? maxDiscount : null, // Apply maxDiscount only for percentage type
            startsAt: startsAt ? new Date(startsAt) : null,
            expiresAt: new Date(expiresAt),
        });

        await newCoupon.save();
        res.json({ success: true, message: "Coupon created successfully!" });

    } catch (error) {
        console.error("Error in addNewCoupon:", error);
        res.status(responseCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server error while creating coupon." });
    }
};


const viewCouponPage = async (req,res)=>{
    try {
        let currentPage = parseInt(req.query.page,10 )  || 1

        let totalPages  , limit = 5
        if(currentPage <1) currentPage = 1
        let allCoupons = await couponSchema.find({})

        totalPages = Math.ceil( allCoupons.length / limit)
        const coupons = await couponSchema.find({}).sort({createdAt:-1}).skip((currentPage-1)*limit).limit(limit)
        let totalItems = coupons.length
        res.render('admin/coupons',{coupons,totalItems,currentPage,totalPages,limit})
    } catch (error) {
        console.log('error in viewing coupon page',error)
    }
}

module.exports= {viewCouponPage,addNewCoupon}