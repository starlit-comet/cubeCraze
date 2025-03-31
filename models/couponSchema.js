const mongoose = require('mongoose');
const { Schema } = mongoose;

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discountType: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED_AMOUNT'], // Supports both types of discounts
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    minOrderAmount: {
        type: Number,
        default: 0 // Minimum order value to apply the coupon
    },
    maxDiscount: {
        type: Number, // Maximum discount allowed (for percentage-based coupons)
        default: null
    },
    expiryDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: 1 // Number of times a single user can use this coupon
    },
    usedBy: [
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            usedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    }
});

// Ensure expiry validation
couponSchema.pre('save', function (next) {
    if (this.expiryDate < new Date()) {
        this.isActive = false;
    }
    next();
});

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
