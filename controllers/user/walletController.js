const walletSchema = require('../../models/walletSchema')
const userSchema = require('../../models/userSchema')
const RESPONSE_CODES = require("../../utils/StatusCodes")

const viewWallet = async (req, res) => {
    try {
        let currentPage = parseInt(req.query.page, 10) || 1;
        const limit = 10; // You can change this limit per page
        if (currentPage < 1) currentPage = 1;

        const userId = req.session._id;
        const wallet = await walletSchema.findOne({ userId });

        if (!wallet) {
            return res.render('users/wallet', {
                wallet: null,
                currentPage,
                limit,
                totalPages: 0,
                totalItems: 0,
                paginatedTransactions: []
            });
        }

        // Reverse to show newest transactions first
        const sortedTransactions = wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const totalItems = sortedTransactions.length;
        const totalPages = Math.ceil(totalItems / limit);

        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

        res.render('users/wallet', {
            wallet: { ...wallet.toObject(), transactions: paginatedTransactions },
            currentPage,
            limit,
            totalPages,
            totalItems
        });

    } catch (error) {
        console.log(error);
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/pagenotfound');
    }
};

module.exports = {viewWallet}
