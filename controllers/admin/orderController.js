const userSchema = require('../../models/userSchema')
const addressSchema = require('../../models/addressSchema')
const productSchema = require ('../../models/productSchema')
const orderSchema = require('../../models/orderSchema')
const sizeSchema = require('../../models/sizeSchema')
const brandSchema = require('../../models/brandSchema')
const categorySchema = require('../../models/categorySchema')
const generateInvoice = require('../../helpers/generateInvoice')


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

const changeOrderStatus =  async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
  
    try {
      const order = await orderSchema.findOne({orderId});
  
      console.log(orderId,status,'hihiw')
      if (!order) {
        return res.status(404).json({ message: 'Order not found!' });
      }
      if(order.status == "Cancelled") return res.status(400).json({message:"Order is already cancelled, can't make any further changes "})
  
      // Update status
      order.status = status;
      // If order is being cancelled, restore product quantities
      if (status === 'Cancelled') {
        for (const item of order.orderedItems) {
          await productSchema.findByIdAndUpdate(item.product, {
            $inc: { quantity: item.quantity }
          });
        }
      }
  
      await order.save();
  
      res.json({ message: `Order status updated to ${status}` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
const  createInvoice = async(req,res)=>{
        try {
          const { orderId } = req.params;
          
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


module.exports={viewOrders,orderDetail,changeOrderStatus,createInvoice}