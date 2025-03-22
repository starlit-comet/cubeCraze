const mongoose = require('mongoose')

const TemporaryOrderSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        unique: true
      },
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        required: true
      },
      receipt: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['created', 'paid', 'failed'],
        default: 'created'
      },
      payment_id: {
        type: String
      },
      notes: {
        type: Object
      },
      createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // ⏰ Auto-delete after 1 hour (optional)
      }
      ,userEmail:String,
      userName:String,
      userPhone:String
})

module.exports = mongoose.model('TemporaryOrder',TemporaryOrderSchema)