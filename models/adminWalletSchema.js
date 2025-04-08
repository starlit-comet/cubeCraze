const mongoose = require('mongoose');

const adminWalletSchema = new mongoose.Schema({
    balance: {
        type: Number,
        required: true,
        default: 0  // Admin wallet starts with zero balance
    },
    transactions: [
        {
            transactionId: {
                type: String,
                required: true,
                unique: true
            },
            transactionDate: {
                type: Date,
                default: Date.now
            },
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',  // Reference to the User schema
                required: true
            },
            transactionType: {
                type: String,
                enum: ['CREDIT', 'DEBIT'], // Credit: Money added, Debit: Money deducted
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            source: {
                type: String,
                enum: ['Order Payment', 'Refund','R', 'Order_Cancellation', 'Manual Adjustment'],
                required: true
            },
            orderId: {
                type: String,
               // ref: 'Order', // Reference to the order if related to refund/cancellation
                required: function () {
                    return this.source === 'Refund' || this.source === 'Order_Cancellation';
                }
            },
            remarks: {
                type: String, // Any extra details about the transaction
                default: ''
            },
            timeStampBalance:{
                type:Number,
                required:true
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('AdminWallet', adminWalletSchema);
