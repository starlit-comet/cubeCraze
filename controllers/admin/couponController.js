const couponSchema = require('../../models/referalCouponSchema')
const codeGenerator = require('../../helpers/generateUniquesVal')

const addNewCoupon = async (req, res) => {
    try {
        let newCouponCode = await codeGenerator.generateUniqueCode();
        const { name, discountType, discountValue, minPurchase, maxDiscount, startsAt, expiresAt } = req.body;

        if (!name || !discountType || !discountValue || !expiresAt) {
            return res.status(400).json({ success: false, message: "All required fields must be filled" });
        }

        if (discountType === 'percentage' && discountValue > 100) {
            return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%" });
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
        res.status(500).json({ success: false, message: "Server error while creating coupon." });
    }
};


const viewCouponPage = async (req,res)=>{
    try {
        const coupons = await couponSchema.find({})
      //  console.log(coupons,'coupon data')
        res.render('admin/coupons',{coupons})
    } catch (error) {
        console.log('error in viewing coupon page',error)
    }
}

module.exports= {viewCouponPage,addNewCoupon}