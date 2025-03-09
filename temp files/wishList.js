const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true }
});

module.exports = mongoose.model('wishlist', wishlistSchema);
