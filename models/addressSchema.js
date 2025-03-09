const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    //country: { type: String, required: true },
    state: { type: String, required: true },
    district:{ type:String, required:true},
    house_flat: {type: String,},    
    pincode: { type: Number, required: true },
    landmark: { type: String },
    mobile: { type: String, required: true },
    alt_phone: { type: String },
    village_city:{type:String},
    street:{type:String},
    //email: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    addressType: { 
        type: String, 
      //  enum: ["Home", "Work", "Other"], 
        default: "Home",
    }
    });

module.exports = mongoose.model('Address', AddressSchema);
