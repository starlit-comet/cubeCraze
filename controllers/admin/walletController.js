const adminWalletSchema = require('../../models/adminWalletSchema')
const userSchema = require('../../models/userSchema')
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require('../../utils/responseMessages')

const viewWallet = async (req, res) => {
    const limit = 10;
    const currentPage = parseInt(req.query.page, 10) || 1;
    let totalItems, totalPages;

    try {
        // Get all transactions for count
        const allItems = await adminWalletSchema.findOne({}).select('transactions -_id');
        let balance = await adminWalletSchema.findOne({}).select('balance -_id')
        totalItems = allItems.transactions.length;
        totalPages = Math.ceil(totalItems / limit);

        // Calculate skip and limit
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;

        // Slice the transactions array manually
        const paginatedTransactions = allItems.transactions.reverse()
            .slice(startIndex, endIndex);

        // Manually populate user field in sliced transactions
        const userIds = paginatedTransactions.map(t => t.user);
        const users = await userSchema.find({ _id: { $in: userIds } }).select('name email phone');

        // Create a map for quick user lookup
        const userMap = {};
        users.forEach(u => userMap[u._id.toString()] = u);

        // Attach user data to transactions
        const transactionsWithUser = paginatedTransactions.map(t => ({
            ...t.toObject(),
            user: userMap[t.user.toString()] || t.user
        }));

        const wallet = { transactions: transactionsWithUser,balance:balance.balance };

        res.status(RESPONSE_CODES.OK).render('admin/wallet', { wallet, totalItems, limit, totalPages, currentPage });
    } catch (error) {
        console.log('Error rendering admin wallet:', error);
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/admin/internal-server-error')
    }
};

module.exports = { viewWallet };
