const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({ 
    name:{
        type:String,
        },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'], // Type of discount: percentage or fixed amount
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 1 // Minimum discount value should be 1
    },
    minPurchase: {
        type: Number,
        default: 0 // Minimum order value required to use the coupon
    },
    maxDiscount: {
        type: Number,
        default: null // Optional limit for percentage-based discounts
    },
    // usageLimit: {
    //     type: Number,
    //     default: 1 // How many times a single user can use the coupon
    // },
    usedBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        usedAt: { type: Date, default: Date.now }
    }],
    expiresAt: {
        type: Date,
        required: true // Expiry date for the coupon
    },
    startsAt: {
        type: Date,
        //required: true // Expiry date for the coupon
    },
    isActive: {
        type: Boolean,
        default: true // Controls if the coupon is active or disabled
    },
    
    // Referral-based coupon fields
    // isReferralCoupon: {
    //     type: Boolean,
    //     default: false // True if the coupon is generated through a referral
    // },
    // referrerId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    //     default: null // User who referred (existing user)
    // },
    // referredUserId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    //     default: null // New user who signed up with referral
    // },
    
}, 
{ timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
