const mongoose = require('mongoose')
const addressSchema = require('../../models/addressSchema');
const { updateMany } = require('../../models/brandSchema');
const userSchema = require('../../models/userSchema')
const responseCodes = require('../../helpers/StatusCodes')

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
            return res.status(responseCodes.UNAUTHORIZED).json({ message: "Unauthorized! Please log in." });
        }

        // Extract other fields from request body
        const { fullname, mobile, alt_phone, addressType, house_flat, street, village_city, district, state, pincode, landmark } = req.body;

        // Server-side validation
        if (!fullname || !mobile || !state || !district || !pincode) {
            return res.status(responseCodes.BAD_REQUEST).json({ message: "All required fields must be filled!" });
        }
        if(!isValidData(fullname)) return res.status(responseCodes.BAD_REQUEST).json({ message: "Name field Should not contain symbols, if required add space in between!" });


        if (!/^\d{6}$/.test(pincode)) {
            return res.status(responseCodes.BAD_REQUEST).json({ message: "Invalid Pincode! It must be 6 digits." });
        }

        if (!/^\d{10}$/.test(mobile)) {
            return res.status(responseCodes.BAD_REQUEST).json({ message: "Invalid Mobile Number! It must be 10 digits." });
        }

        if (alt_phone && !/^\d{10}$/.test(alt_phone)) {
            return res.status(responseCodes.BAD_REQUEST).json({ message: "Invalid Alternate Phone! It must be 10 digits." });
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
        res.status(responseCodes.CREATED).json({ message: "Address added successfully!" });
    } catch (error) {
        console.error(error);
        res.status(responseCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
    }

}

const viewAddressPage = async (req,res)=>{
    res.render('users/address',{searchKeyWord:'',minPrice:0,maxPrice:7500})

}

const viewEditAddress = async (req,res)=>{
    const userId = req.session._id
    const addressId = req.params._id
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(responseCodes.NOT_FOUND).redirect('/pagenotfound');
    }
    const addressExist = await addressSchema.exists({_id:addressId})
    if(!addressExist) return res.status(responseCodes.NOT_FOUND).redirect('/pagenotfound')
    const address = await addressSchema.findById(addressId)
    res.render('users/editAddress',{address,searchKeyWord:'',minPrice:0,maxPrice:0})

}

const editAddress = async (req, res) => {
    try {
        const userId  = req.session._id; // Get user ID from session
        const addressId = req.body.addressId; // Address ID (pass this from frontend)
        const updateFields = req.body; // Fields sent from frontend (only changed ones)
        if (!userId || !addressId) {
            return res.status(responseCodes.BAD_REQUEST).json({ message: "Invalid request: Missing user or address ID." });
        }

        // Find the existing address to ensure it belongs to the user
        const address = await addressSchema.findOne({ _id: addressId, userId });

        if (!address) {
            return res.status(responseCodes.NOT_FOUND).json({ message: "Address not found or not authorized." });
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
        return res.status(responseCodes.OK).json({ message: "Address updated successfully." });
    } catch (error) {
        console.error("Error updating address:", error);
        return res.status(responseCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
}

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session._id; // Get user ID from session
        let { addressId } = req.body;

        if (!userId || !addressId) {
            return res.status(responseCodes.BAD_REQUEST).json({ message: "Invalid request: Missing user or address ID." });
        }

        // Convert addressId to ObjectId
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(responseCodes.BAD_REQUEST).json({ message: "Invalid address ID format." });
        }

        addressId = new mongoose.Types.ObjectId(addressId);

        // Count user's addresses
        const addressCount = await addressSchema.countDocuments({ userId });

        if (addressCount <= 1) {
            return res.status(responseCodes.BAD_REQUEST).json({ message: "You must have at least one address." });
        }

        // Find and delete the address
        const deletedAddress = await addressSchema.findOneAndDelete({ _id: addressId, userId });
        if (!deletedAddress) {
            return res.status(responseCodes.NOT_FOUND).json({ message: "Address not found or not authorized." });
        }
        const updatedUser = await userSchema.findByIdAndUpdate(userId,{
            $pull:{addresses:addressId} // removes addressId from user data
        })

        return res.status(responseCodes.OK).json({ message: "Address deleted successfully." });

    } catch (error) {
        console.error("Error deleting address:", error);
        return res.status(responseCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
}


module.exports={addAddress,viewAddressPage,editAddress,viewEditAddress,deleteAddress}