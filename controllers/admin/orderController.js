const userSchema = require('../../models/userSchema')
const addressSchema = require('../../models/addressSchema')
const productSchema = require ('../../models/productSchema')
const orderSchema = require('../../models/orderSchema')
const sizeSchema = require('../../models/sizeSchema')
const brandSchema = require('../../models/brandSchema')
const categorySchema = require('../../models/categorySchema')
const walletHelper = require('../../helpers/walletHelper')
const generateInvoice = require('../../helpers/generateInvoice')
const generateSalesReport = require('../../helpers/generateSalesReport')

const fs = require('fs')

const viewOrders = async(req,res)=>{
    try {
        
        const orders = await orderSchema.find().sort({invoiceDate:-1})
        console.log(orders )
        res.render('admin/orders',{orders}) 
    } catch (error) {
        
    }
}

const orderDetail = async (req,res)=>{
    try {
        const {orderId} = req.params
        const orderExists = await orderSchema.exists({orderId})
        // console.log(productExists,'product find sttauts')
        if(!orderExists) return res.redirect('/admin/page-not-found')
        const order = await orderSchema.findOne({orderId})
        .populate('userId')
        .populate({
        path:'orderedItems.product',
        select:'productName productImages promotionalPrice brand cateogory size',
        populate:[
            {path: 'brand', select:'brandName'},
            {path:'size', select:'size'},
            {path:'category',select:'categoryName'}
        ]
    })
        res.render('admin/orderDetail',{order})
    } catch (error) {
        
    }
}

const changeOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
      const orderExists = await orderSchema.exists({orderId})
      if(!orderExists) return res.status(404).redirect('/admin/page-not-found')
      const order = await orderSchema.findOne({ orderId });

      if (!order) {
          return res.status(404).json({ message: 'Order not found!' });
      }

      if (order.status === "Cancelled" || order.status === "Delivered") {
          return res.status(400).json({ message: "Can't make any further changes to this order" });
      }

      if (status === 'Cancelled') {
          order.status = status;
          for (const item of order.orderedItems) {
              await productSchema.findByIdAndUpdate(item.product, {
                  $inc: { quantity: item.quantity }
              });
          }
          for (let item of order.orderedItems) {
              if (item.status !== 'Cancelled') {
                  item.status = status;
              }
          }
      } 
      else if (status === "Shipped") {
          if (order.status !== 'Processing') {
              return res.status(400).json({ message: "Only pending orders can be changed to shipped" });
          }
          order.status = status;
          for (let item of order.orderedItems) {
              if (item.status !== 'Cancelled') {
                  item.status = status;
              }
          }
      } 
      else if (status === "Delivered") {
          if (order.status !== 'Shipped') {
              return res.status(400).json({ message: "Only shipped orders can be changed to delivered" });
          }
          order.status = status;
          for (let item of order.orderedItems) {
              if (item.status !== 'Cancelled') {
                  item.status = status;
              }
          }
      } else {
          return res.status(400).json({ message: "Invalid status update" });
      }

      await order.save();
      res.json({ message: `Order status updated to ${status}` });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
};


const  createInvoice = async(req,res)=>{
        try {
          const { orderId } = req.params;
          const orderExists = await orderSchema.exists({orderId})
          if(!orderExists) return res.status(404).redirect('/admin/page-not-found')
          // Fetch the order
          const order = await orderSchema.findOne({ orderId }).lean();
          if (!order) {
              return res.status(404).json({ message: 'Order not found!' });
            }
            const userId = order.userId; // Secure access, if session available
      
          // Fetch user data if needed
          const user = await userSchema.findById(userId).lean();
      
          // ✅ Generate and stream PDF invoice
          generateInvoice(order, user, res);
        } catch (error) {
          console.log('Invoice generation error:', error);
          return res.status(500).json({ message: 'Server error while generating invoice.' });
        }
}

const generateReport = async (req, res) => {
  const { fromDate, toDate, fileType } = req.query;

  if (fileType === 'excel') {
      return generateSalesReport.generateExcelReport(fromDate, toDate, res);
  }
  else if(fileType === 'pdf'){
    return generateSalesReport.generatePDFReport(fromDate,toDate,res)
  }

  else return res.status(400).json({ error: "Invalid file type requested." });
};

const approveReturnRequest = async(req,res)=>{
  try {
    const { orderId, itemId } = req.body;

    const order = await orderSchema.findOne({ orderId });
    if (!order) return res.status(404).json({ message: "Order not found!" });

    const item = order.orderedItems.find(item => item.product.toString() === itemId);
    if (!item) return res.status(404).json({ message: "Item not found in order!" });

    if (item.status !== "Return Requested") {
        return res.status(400).json({ message: "This item is not in return requested status." });
    }
    console.log(item,'updateThis')
    // Restore stock and credit usr wallt
    await productSchema.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    await walletHelper.addCredit(order.userId,item.price*item.quantity,'PRODUCT_RETURN_REFUND',order.id,item.product)
   

    // Update order item status
    item.status = "Returned";
    item.returnedOn = new Date();

    await order.save();
    res.json({ message: "Return approved and processed successfully!" });
} catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while approving return." });
}}

const rejectReturnRequest = async (req,res)=>{
  const { orderId, itemId } = req.body;

    try {
        const order = await orderSchema.findOne({ orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const item = order.orderedItems.find(i => i.product.toString() === itemId);
        if (!item) return res.status(404).json({ message: 'Item not found in order' });

        if (item.status !== 'Return Requested') {
            return res.status(400).json({ message: "Return request not found or already processed" });
        }

        // Change status back to Delivered
        item.status = 'Return Cancelled';

        await order.save();

        res.json({ message: "Return request denied" });

    } catch (error) {
        console.error("Error denying return:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


module.exports={viewOrders,orderDetail,changeOrderStatus,createInvoice,
  generateReport,approveReturnRequest,rejectReturnRequest}