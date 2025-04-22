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
const RESPONSE_CODES = require('../../utils/StatusCodes')


const fs = require('fs')
const MESSAGES = require('../../utils/responseMessages')

const viewOrders = async(req,res)=>{
    try {
        let totalItems, currentPage,totalPages,limit=10
        currentPage = parseInt(req.query.page,10) || 1
        if(currentPage<1) currentPage =1
        let allOrders = await orderSchema.find({})
        totalItems = allOrders.length
        totalPages = Math.ceil(totalItems/limit)
        const orders = await orderSchema.find().sort({invoiceDate:-1})
        .skip((currentPage-1)*limit)
        .limit(limit)
        res.render('admin/orders',{orders,totalItems, currentPage,totalPages,limit}) 
    } catch (error) {
        console.log(error)
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/admin/internal-server-error')
        
    }
}

const orderDetail = async (req,res)=>{
    try {
        const {orderId} = req.params
        const orderExists = await orderSchema.exists({orderId})
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
        res.status(RESPONSE_CODES.OK).render('admin/orderDetail',{order})
    } catch (error) {
        console.log(error)
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/admin/internal-server-error')
    }
}

const changeOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
      const orderExists = await orderSchema.exists({orderId})
      if(!orderExists) return res.status(RESPONSE_CODES.NOT_FOUND).redirect('/admin/page-not-found')
      const order = await orderSchema.findOne({ orderId });

      if (!order) {
          return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ORDER_NOT_FOUND});
      }

      if (order.status === "Cancelled" || order.status === "Delivered") {
          return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.CANT_MAKE_ANY_OTHER_CHANGES });
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
              return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.ONLY_PENDING_ORDERS_CANBE_CHANGED_TO_SHIPPING });
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
              return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.ONLY_SHIPPED_ORDERS_CAN_BE_CHANGED_TO_DELIVERED  });
          }
          order.status = status;
          for (let item of order.orderedItems) {
              if (item.status !== 'Cancelled') {
                  item.status = status;
              }
          }
          if(order.paymentMethod==='cod'){
          await walletHelper.updateAdminWallet(order.userId,'CREDIT',order.finalAmount,'Order Payment',order.orderId,'cod_payment_after_delivery')
          }
      } else {
          return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.INVALID_STATUS_UPDATE });
      }

      await order.save();
      res.status(RESPONSE_CODES.OK).json({ message: `Order status updated to ${status}` });
  } catch (error) {
      console.error(error);
      res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
  }
};


const  createInvoice = async(req,res)=>{
        try {
          const { orderId } = req.params;
          const orderExists = await orderSchema.exists({orderId})
          if(!orderExists) return res.status(RESPONSE_CODES.NOT_FOUND).redirect('/admin/page-not-found')
          // Fetch the order
          const order = await orderSchema.findOne({ orderId }).lean();
          if (!order) {
              return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ORDER_NOT_FOUND });
            }
            const userId = order.userId; // Secure access, if session available
      
          // Fetch user data if needed
          const user = await userSchema.findById(userId).lean();
      
          // ✅ Generate and stream PDF invoice
          generateInvoice(order, user, res);
        } catch (error) {
          console.log('Invoice generation error:', error);
          return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR ).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
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

  else return res.status(RESPONSE_CODES.BAD_REQUEST).json({ error: MESSAGES.INVALID_FILE_TYPE_REQUESTED });
};

const approveReturnRequest = async(req,res)=>{
  try {
    const { orderId, itemId } = req.body;

    const order = await orderSchema.findOne({ orderId });
    if (!order) return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ORDER_NOT_FOUND });

    const item = order.orderedItems.find(item => item.product.toString() === itemId);
    if (!item) return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ITEM_NOT_FOUND_IN_ORDER });

    if (item.status !== "Return Requested") {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message:MESSAGES.ITEM_NOT_IN_RETURN_REQUEST });
    }
    // Restore stock and credit usr wallt
    await productSchema.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    await walletHelper.addCredit(order.userId,item.price*item.quantity,'PRODUCT_RETURN_REFUND',order.id,item.product)
   

    // Update order item status
    item.status = "Returned";
    item.returnedOn = new Date();

    await walletHelper.updateAdminWallet(order.userId,'DEBIT',item.price*item.quantity,'Refund',order.orderId,'product_return_refund')

    await order.save();
    res.status(RESPONSE_CODES.OK).json({ message: MESSAGES.RETURN_APPROVED_AND_PROCESSED_SUCCESSFULLY  });
} catch (error) {
    console.error(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR ).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
}}

const rejectReturnRequest = async (req,res)=>{
  const { orderId, itemId } = req.body;

    try {
        const order = await orderSchema.findOne({ orderId });
        if (!order) return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ORDER_NOT_FOUND });

        const item = order.orderedItems.find(i => i.product.toString() === itemId);
        if (!item) return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ITEM_NOT_FOUND_IN_ORDER });

        if (item.status !== 'Return Requested') {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.RETURN_REQUEST_NOT_FOUND_OR_ALREADY_PROCESSED });
        }

        // Change status back to Delivered
        item.status = 'Return Cancelled';
        

        await order.save();

        res.status(RESPONSE_CODES.OK).json({ message: "Return request denied" });

    } catch (error) {
        console.error("Error denying return:", error);
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR ).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
}


module.exports={viewOrders,orderDetail,changeOrderStatus,createInvoice,
  generateReport,approveReturnRequest,rejectReturnRequest}