const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['CREDIT', 'DEBIT'], // CREDIT for refund/bonus, DEBIT for payments
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    reason: {
        type: String,
        enum: [
            'ORDER_CANCEL_REFUND',
            'RETURN_PRODUCT_REFUND',
            'ADMIN_CREDIT',
            'PURCHASE_DEDUCT',
            'WITHDRAWAL'
        ],
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'PENDING'],
        default: 'SUCCESS'
    },
    note: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    transactions: [walletTransactionSchema],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Wallet', walletSchema);
