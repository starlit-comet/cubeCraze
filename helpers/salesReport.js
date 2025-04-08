const orderSchema = require('../models/orderSchema')

const productsSold = async (req, res) => {
    try {
        const allOrders = await orderSchema.find().select('orderedItems -_id');

        const productSold = allOrders.flatMap(order => order.orderedItems);

        // Track product sales, categories, brands, and revenue
        let productCount = {};
        let categoryCount = {};
        let brandCount = {};
        let totalRevenue = 0;

        productSold.forEach(item => {
            const productId = item.product.toString();  // Convert ObjectId to string
            const category = item.productDetails.category;
            const brand = item.productDetails.brand;

            // Count product sales
            productCount[productId] = (productCount[productId] || { name: item.productDetails.name, quantity: 0, revenue: 0 });
            productCount[productId].quantity += item.quantity;
            productCount[productId].revenue += item.quantity * item.price;

            // Count category sales
            categoryCount[category] = (categoryCount[category] || 0) + item.quantity;

            // Count brand sales
            brandCount[brand] = (brandCount[brand] || 0) + item.quantity;

            // Calculate total revenue
            totalRevenue += item.quantity * item.price;
        });

        // Sort to get top sold items
        const topProducts = Object.values(productCount).sort((a, b) => b.quantity - a.quantity);
        const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
        const topBrands = Object.entries(brandCount).sort((a, b) => b[1] - a[1]);

        const salesReport = {
            totalRevenue,
            topProducts: topProducts.slice(0, 5), // Top 5 products
            topCategories: topCategories.slice(0, 5), // Top 5 categories
            topBrands: topBrands.slice(0, 5) // Top 5 brands
        };

        console.log('Sales Report:', salesReport);
        res.json(salesReport);
    } catch (error) {
        console.error("Error generating sales report:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


module.exports={productsSold}