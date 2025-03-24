const Wallet = require('../models/walletSchema'); 

/**
 * Add credit to user's wallet
 * @param {String} userId 
 * 
 * @param {Number} amount 
 * @param {String} reason 
 * @param {String} [orderId] 
 * @param {String} [productId]
 * @param {String} [note] 
 */
async function addCredit(userId, amount, reason, orderId = null, productId = null, note = '') {
    try {
        if (amount <= 0) {
            throw new Error('Credit amount must be greater than zero.');
        }

        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
          
            wallet = new Wallet({
                userId,
                balance: 0,
                transactions: []
            });
        }

        const transaction = {
            type: 'CREDIT',
            amount,
            reason,
            orderId,
            productId,
            status: 'SUCCESS',
            note
        };

        
        wallet.balance += amount;
        wallet.transactions.push(transaction);
        wallet.updatedAt = new Date();

        await wallet.save();

        console.log(`Credited ₹${amount} to user ${userId}. New balance: ₹${wallet.balance}`);
        return wallet;

    } catch (error) {
        console.error('Error in addCredit:', error.message);
        throw error;
    }
}

/**
 * Deduct amount from user's wallet
 * @param {String} userId 
 * @param {Number} amount 
 * @param {String} reason
 * @param {String} [orderId] 
 * @param {String} [productId] 
 * @param {String} [note] 
 */
async function deductAmount(userId, amount, reason, orderId = null, productId = null, note = '') {
    try {
        if (amount <= 0) {
            throw new Error('Deduction amount must be greater than zero.');
        }

        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            throw new Error('Wallet not found.');
        }

        if (wallet.balance < amount) {
            throw new Error('Insufficient wallet balance.');
        }

        const transaction = {
            type: 'DEBIT',
            amount,
            reason,
            orderId,
            productId,
            status: 'SUCCESS',
            note
        };

     
        wallet.balance -= amount;
        wallet.transactions.push(transaction);
        wallet.updatedAt = new Date();

        await wallet.save();

        console.log(`Debited ₹${amount} from user ${userId}. New balance: ₹${wallet.balance}`);
        return wallet;

    } catch (error) {
        console.error('Error in deductAmount:', error.message);
        throw error;
    }
}

module.exports = {
    addCredit,
    deductAmount
};
