const couponSchema = require('../../models/referalCouponSchema')
const codeGenerator = require('../../helpers/generateUniquesVal')
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require('../../utils/responseMessages')

const addNewCoupon = async (req, res) => {
    try {
        let newCouponCode = await codeGenerator.generateUniqueCode();
        const { name, discountType, discountValue, minPurchase, maxDiscount, startsAt, expiresAt } = req.body;

        if (!name || !discountType || !discountValue || !expiresAt) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.ALL_FIELDS_ARE_REQUIRED });
        }
        if(discountType === 'fixed'){
            if(discountValue > minPurchase ) return res.status(RESPONSE_CODES.BAD_REQUEST).json({success:false,message:MESSAGES.MIN_AMOUNT_ERR})
        }
        if (discountType === 'percentage' ) {
            if( discountValue > 100) return res.status(RESPONSE_CODES.BAD_REQUEST).json({ success: false, message:MESSAGES.PERCENTAGE_MORETHAN_100 })
            if(discountValue<1 ) return res.status(RESPONSE_CODES.BAD_REQUEST).json({success:false,message:MESSAGES.PERCENTAGE_LESSTHAN_0})
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
        res.status(RESPONSE_CODES.OK).json({ success: true, message:MESSAGES.COUPON_CREATED });

    } catch (error) {
        console.error("Error in addNewCoupon:", error);
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.INTERNAL_SERVER_ERROR });
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
        return res.render('admin/coupons',{coupons,totalItems,currentPage,totalPages,limit})
    } catch (error) {
        console.log('error in viewing coupon page',error)
        return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('internal-server-error')
    }
}

module.exports= {viewCouponPage,addNewCoupon}