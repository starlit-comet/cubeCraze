const mongoose = require('mongoose')
const addressSchema = require('../../models/addressSchema');
const { updateMany } = require('../../models/brandSchema');
const userSchema = require('../../models/userSchema')
const RESPONSE_CODES = require('../../utils/StatusCodes');
const MESSAGES = require('../../utils/responseMessages');

function isValidData(input) {

    const regex = /^[A-Za-z ]+$/;
    const trimmedInput = input.trim();
    return regex.test(trimmedInput);
  }

const addAddress = async (req,res)=>{
    try {
        // Retrieve user ID from session
        const userId = req.session?._id;
        if (!userId) {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({ message: MESSAGES.UNAUTHORIZED });
        }

        // Extract other fields from request body
        const { fullname, mobile, alt_phone, addressType, house_flat, street, village_city, district, state, pincode, landmark } = req.body;

        // Server-side validation
        if (!fullname || !mobile || !state || !district || !pincode) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.ALL_FIELDS_ARE_REQUIRED });
        }
        if(!isValidData(fullname)) return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.NAME_SHOULD_NOT_CONTAIN_SYMBOLS });


        if (!/^\d{6}$/.test(pincode)) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.INVALID_PINCODE });
        }

        if (!/^\d{10}$/.test(mobile)) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.INVALID_MOBILE_NUMBER });
        }

        if (alt_phone && !/^\d{10}$/.test(alt_phone)) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.INVALID_ALT_MOBILE });
        }

        // Create new address entry
        const newAddress = new addressSchema({
            fullname,
            mobile,
            alt_phone,
            addressType,
            house_flat,
            street,
            village_city,
            district,
            state,
            pincode,
            landmark,
            userId // Set userId from session
        });

        // Save to database
        const savedAddress = await newAddress.save();
        // Push address ID into User's "addresses" array
        await userSchema.findByIdAndUpdate(userId, { 
            $push: { addresses: savedAddress._id } 
        });
        res.status(RESPONSE_CODES.CREATED).json({ message: MESSAGES.ADDRESS_ADDEDD_SUCCESSFULLY  });
    } catch (error) {
        console.error(error);
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
    }

}

const viewAddressPage = async (req,res)=>{
    res.status(RESPONSE_CODES.OK).render('users/address',{searchKeyWord:'',minPrice:0,maxPrice:7500})

}

const viewEditAddress = async (req,res)=>{
    const userId = req.session._id
    const addressId = req.params._id
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(RESPONSE_CODES.NOT_FOUND).redirect('/pagenotfound');
    }
    const addressExist = await addressSchema.exists({_id:addressId})
    if(!addressExist) return res.status(RESPONSE_CODES.NOT_FOUND).redirect('/pagenotfound')
    const address = await addressSchema.findById(addressId)
    res.status(RESPONSE_CODES.OK).render('users/editAddress',{address,searchKeyWord:'',minPrice:0,maxPrice:0})

}

const editAddress = async (req, res) => {
    try {
        const userId  = req.session._id; // Get user ID from session
        const addressId = req.body.addressId; // Address ID (pass this from frontend)
        const updateFields = req.body; // Fields sent from frontend (only changed ones)
        if (!userId || !addressId) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.INVALID_REQUEST_MISSING_USERID_OR_ADDRESS });
        }

        // Find the existing address to ensure it belongs to the user
        const address = await addressSchema.findOne({ _id: addressId, userId });

        if (!address) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({ message:MESSAGES.ADDRESS_NOT_FOUND_OR_NOT_AUTHORISED  });
        }

        // Update only changed fields
        for (const key in updateFields) {
            if (updateFields[key] !== undefined && key!=='addressId' ) {
                address[key] = updateFields[key];
            }
        }

        // Save the updated address
        await address.save();

        console.log(`Address Updated`)
        return res.status(RESPONSE_CODES.OK).json({ message: MESSAGES.ADDRESS_UPDATED_SUCCESSFULLY });
    } catch (error) {
        console.error("Error updating address:", error);
        return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session._id; // Get user ID from session
        let { addressId } = req.body;

        if (!userId || !addressId) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.INVALID_REQ_MISSING_USER_OR_ADDRESS_ID });
        }

        // Convert addressId to ObjectId
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.INVALID_ADDRESS_ID_FORMAT });
        }

        addressId = new mongoose.Types.ObjectId(addressId);

        // Count user's addresses
        const addressCount = await addressSchema.countDocuments({ userId });

        if (addressCount <= 1) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.YOU_MUST_HAVE_AT_LEAST_ONE_ADDRESS });
        }

        // Find and delete the address
        const deletedAddress = await addressSchema.findOneAndDelete({ _id: addressId, userId });
        if (!deletedAddress) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.ADDRESS_NOT_FOUND_OR_NOT_AUTHORISED });
        }
        const updatedUser = await userSchema.findByIdAndUpdate(userId,{
            $pull:{addresses:addressId} // removes addressId from user data
        })

        return res.status(RESPONSE_CODES.OK).json({ message: MESSAGES.ADDRESS_DELETED_SUCCESSFULLY  });

    } catch (error) {
        console.error("Error deleting address:", error);
        return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
}


module.exports={addAddress,viewAddressPage,editAddress,viewEditAddress,deleteAddress}