const adminModel = require('../../models/adminModel')
const brandsSchema = require('../../models/brandSchema')
const categorySchema = require('../../models/categorySchema')
const couponSchema = require('../../models/referalCouponSchema')
const userSchema = require('../../models/userSchema')
const productSchema = require ('../../models/productSchema')
const orderSchema = require('../../models/orderSchema')
const sizeSchema = require('../../models/sizeSchema')
const walletHelper = require('../../helpers/walletHelper')
const generateInvoice = require('../../helpers/generateInvoice')
const generateSalesReport = require('../../helpers/generateSalesReport')
const AdminWallet = require("../../models/adminWalletSchema");


async function productsSold (query) {
    try {

        const allOrders = await orderSchema.find(query).select('orderedItems -_id')
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
        
       // console.log('Sales Report:', salesReport);
        return salesReport
      //  res.json(salesReport);
    } catch (error) {
        console.error("Error generating sales report:", error);
        
    }
};


const viewDashboard = async (req, res) => {
//    if(!req.session.admin) return res.redirect('/admin/login')
    let barGraphData=[10,20,30,40]
    const {date}=req.query
    console.log(date,'date')
    let query={}
    if(date){ 
        const now = new Date();
        let startDate, endDate;
      
        switch (date) {
        //   case 'today':
        //     startDate = new Date(now.setHours(0, 0, 0, 0));
        //     endDate = new Date(now.setHours(23, 59, 59, 999));
        //     break;
      
        //   case 'this_week':
        //     const dayOfWeek = now.getDay();
        //     const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        //     startDate = new Date(now.setDate(diffToMonday));
        //     startDate.setHours(0, 0, 0, 0);
        //     endDate = new Date();
        //     endDate.setHours(23, 59, 59, 999);
        //     break;
      
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
      
          case 'last_month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
      
          case 'last_3_months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            break;
      
          case 'last_6_months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            break;
      
        //   case 'this_year':
        //     startDate = new Date(now.getFullYear(), 0, 1);
        //     endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        //     break;
      
          case 'last_year':
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
            break;
      
          default: // 'all' or any unrecognized input
            startDate = new Date(0); // 1970-01-01
            endDate = new Date();    // now
            endDate.setHours(23, 59, 59, 999);
            break;
        }
         query = {
            invoiceDate:{$gte:startDate,$lte:endDate}
        }
    }
    else{
        query = {
            invoiceDate:{$gte:new Date(0),$lte:new Date()}
        }
    }
    try {
        let dateRange = query.invoiceDate
        console.log(dateRange,'date')
        const totalCustomers = await userSchema.find({createdOn:dateRange})
        const newProducts = await productSchema.find({createdAt:dateRange})
        const salesReport = await productsSold(query)
       
        const allOrders = await orderSchema.find(query)
        barGraphData[0] = totalCustomers.length
        barGraphData[1] = allOrders.length
        barGraphData[2]=0
        salesReport?.topBrands.map(item=>{
            barGraphData[2]+=item[1]
        })
        barGraphData[3]= newProducts.length
        let totalProductsSold=0,totalOrders=0
        allOrders.map(item=>{
            item.orderedItems.map(val=>{
                totalProductsSold += val.quantity
            })
            totalOrders++
        })
        //console.log('totalCount',totalProductsSold)
        // Get total order amount per month
        const monthlySales = await orderSchema.aggregate([
            // {
            //     $match: {
            //         status: { $ne: "Cancelled" } // Optional: Exclude cancelled
            //     }
            // },
            // {
            //     $match:query
            // },
            {
                $group: {
                    _id: { $month: "$createdOn" },
                    total: { $sum: "$finalAmount" }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        // Fill in all months (1-12), even if data is missing
        const salesData = Array(12).fill(0);
        monthlySales.forEach(item => {
            salesData[item._id - 1] = item.total;
        });
        console.log(salesReport)
        const wallet = await AdminWallet.findOne()
        const walletBalance = wallet.balance
       return res.render("admin/dashboard", { barGraphData,salesData,totalProductsSold,totalOrders,walletBalance,salesReport });
    } catch (error) {
        console.log("Error loading dashboard:", error);
        res.status(500).send("Dashboard error");
    }
};

module.exports={viewDashboard,productsSold}