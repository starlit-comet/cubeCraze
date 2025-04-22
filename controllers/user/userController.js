const userSchema = require("../../models/userSchema");
const referalcouponSchema = require("../../models/referalCouponSchema");
const bcrypt = require("bcrypt");
//const saltRound=process.env.SALTROUND
const nodemailer = require("../../helpers/nodemailer");
const couponGenerator = require("../../helpers/generateUniquesVal"); // same fn as referal generator
const { validate } = require("uuid");
const RESPONSE_CODES = require('../../utils/StatusCodes');
const MESSAGES = require("../../utils/responseMessages");


const generateNewOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
  // if(value >100000 && value < 999999) return value
  // else {generateNewOTP()}
};

function isStrongPassword(password) {
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}

function validatePhoneNumber(phone) {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

function validateName(name) {
  const nameRegex = /^[A-Za-z\s]{2,50}$/;
  return nameRegex.test(name);
}

async function createCuponForReferal(R_Code) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 100);
  try {
    let newCouponCode = await couponGenerator.generateUniqueCode();
    let newCoupon = new referalcouponSchema({
      code: newCouponCode,
      discountType: "fixed",
      discountValue: 100,
      minPurchase: 200,
      expiresAt,
    });
    await newCoupon.save();
    await userSchema.findOneAndUpdate(
      { referalCode: R_Code },
      { $push: { coupon: newCoupon._id } }
    );

    return newCoupon;
  } catch (error) {
    console.log(error);
    return error;
  }
}

const userLogin = async (req, res) => {
  try {
    res.status(RESPONSE_CODES.OK).render("users/login");
  } catch (error) {
    console.log(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR ).redirect("/pagenotfound");
  }
};
const errorPage = async (req, res) => {
  try {
    res.status(RESPONSE_CODES.OK).render("users/pagenotfound");
  } catch (error) {
    console.log(error);
  }
};

const signUp = async (req, res) => {
  try {

    res.render("users/signup");
  } catch (error) {
    console.log(error);
    
  }
};
const aboutPage = async (req, res) => {
  try {
    res.redirect("/pagenotfound");
  } catch (error) {
    console.log(error);
  }
};
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userSchema
      .findOne({ email, googleId: "noGoogleId", isBlocked: false })
      .sort();
    if (!user) return res.status(RESPONSE_CODES.OK).json({ message: MESSAGES.EMAIL_NOT_FOUND });

    const isMatchPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatchPassword)
      return res
        .status(RESPONSE_CODES.OK)
        .json({ message: MESSAGES.PASSWORDS_NOT_MATCHING , success: false });
    if (!user.isOTPVerified) {
      req.session.userEmail = user.email;
      return res
        .status(RESPONSE_CODES.OK)
        .json({
          message: MESSAGES.USER_NOT_OTP_VERIFIED ,
          success: false,
          redirectOTP: true,
        });
    }
    if (isMatchPassword) {
      req.session._id = user._id;
      return res
        .status(RESPONSE_CODES.ACCEPTED)
        .json({ message: MESSAGES.LOGIN_SUCCESS, success: true });
    } else res.send(MESSAGES.PASSWORDS_NOT_MATCHING);
  } catch (error) {
    console.log(error);
  }
};
const createUser = async (req, res) => {
  try {
    const referalCode = await couponGenerator.generateUniqueCode();
    const {
      email,
      name,
      password,
      confirmPassword,
      referralCode,
      haveReferralCode,
    } = req.body;
    if (name == "")
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.NAME_CANNOT_BE_EMPTY });
    const user = await userSchema.findOne({ email });
    if (user)
      return res
        .status(RESPONSE_CODES.BAD_REQUEST)
        .json({ message: MESSAGES.USER_ALREADY_EXISTS, success: false });
    if (password == "" || confirmPassword == "")
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.PASSWORD_CANNOT_BE_EMPTY  });
    if (password !== confirmPassword)
      return res
        .status(RESPONSE_CODES.BAD_REQUEST)
        .json({ message: MESSAGES.PASSWORDS_NOT_MATCHING , success: false });
    const passwordStrength = isStrongPassword(password);
    if (!passwordStrength)
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        message: MESSAGES.PASSWORD_NOT_STRONG ,
        success: false,
      });
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userSchema({
      email,
      name,
      hashedPassword,
      referalCode,
    });
    if (haveReferralCode == "yes") {
      let isReferalValid = await userSchema.findOne({
        referalCode: referralCode,
      });
      if (!isReferalValid)
        return res
          .status(RESPONSE_CODES.BAD_REQUEST)
          .json({
            message: MESSAGES.REFERAL_CODE_NOT_VALID
          });
      else {
        couponId = await createCuponForReferal(referralCode);
        newUser.coupon.push(couponId._id);
      }
    }
    await newUser.save();

    console.log(`new User added : ${name}`);
    req.session.userEmail = email;
    return res
      .status(RESPONSE_CODES.CREATED)
      .json({
        message: MESSAGES.NEW_ACCOUNT_CREATED_VERIFY_OTP,
        success: true,
      });
  } catch (error) {
    console.log(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message:MESSAGES.ERROR_CREATING_NEW_ACCOUNT})
  }
};
const userProfile = (req, res) => {

  if (!req.user) return res.redirect("/login");
  req.session._id = req.user._id;
  res.status(RESPONSE_CODES.TEMPORARY_REDIRECT).redirect("/home");
};
const logout = (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.status(RESPONSE_CODES.TEMPORARY_REDIRECT).redirect("/home");
    });
  });
};

const viewOTPpage = async (req, res) => {
  const email = req.session.userEmail;
  const newUser = await userSchema.findOne({ email }).select("name email -_id");
  res.status(RESPONSE_CODES.OK).render("common/generateOTP", { newUser });
};

const verifyOTP = async (req, res) => {
  const { otp, emailFromFront } = req.body;
  const userEmail = req.session.userEmail;
  const forgetPassword = req.session.forgetPassword;

  console.log(`otp from page: ${otp}`);
  console.log(`user data:${userEmail}`);
  if (!otp) {
    return res
      .status(RESPONSE_CODES.BAD_REQUEST)
      .json({ success: false, message: MESSAGES.OTP_REQUIRED });
  }
  let userData = await userSchema.findOne({ email: userEmail });
  if (otp === userData.otp && userData.otpExpires > Date.now()) {

    userData = await userSchema.findByIdAndUpdate(
      userData._id,
      { isOTPVerified: true, otp: null, otpExpires: null },
      { new: true }
    );

    req.session.user = userData._id;

    if (forgetPassword) {
      return res
        .status(RESPONSE_CODES.CREATED)
        .json({
          message: MESSAGES.REDIRECTING_TO_OTP_PAGES,
          forgetPassword: true,
        });
    }

    return res.status(RESPONSE_CODES.OK).json({ success: true, message: MESSAGES.OTP_VERIFIED });
  } else if (userData.otpExpires <= Date.now()) {
    console.log(`otp matched but its expired`);
    await userSchema.findByIdAndUpdate(userData._id, {
      otp: null,
      otpExpires: null,
    });
    return res
      .status(RESPONSE_CODES.BAD_REQUEST)
      .json({
        message: MESSAGES.OTP_EXPIRED_GENERATE_NEW_ONE,
        success: false,
      });
  } else if (otp !== userData.otp && userData.otpExpires > Date.now()) {
    return res
      .status(RESPONSE_CODES.NOT_FOUND)
      .json({ message: MESSAGES.OTP_NOT_MATCHING , success: false });
  } else {
    return res
      .status(RESPONSE_CODES.BAD_REQUEST)
      .json({ success: false, message: MESSAGES.INCORRECT_OTP });
  }
};

const sendOTPtoEmail = async (req, res) => {
  try {
    const email = req.session.userEmail;
    let userData = await userSchema.findOne({ email });
    if (userData.isOTPVerified == true)
      return res
        .status(RESPONSE_CODES.BAD_REQUEST)
        .json({ success: false, message: MESSAGES.USER_ALREADY_VERIFIED  });
    const resendOTPafter = req.session.resendOTPafter;
    if (resendOTPafter && userData.otpExpires > Date.now()) {
      if (resendOTPafter >= Date.now())
        return res
          .status(RESPONSE_CODES.BAD_REQUEST)
          .json({
            success: false,
            message: MESSAGES.KINDLY_WAIT_FOR_SOME_TIME
          });
      else if (resendOTPafter < Date.now()) {
        let userData = await userSchema.findOne({ email });
        const mailOptions = nodemailer.mailCreator(userData);
        await nodemailer.transporter.sendMail(mailOptions);
        console.log("otp resent success");
        req.session.resendOTPafter = Date.now() + 60 * 1000;
        return res
          .status(RESPONSE_CODES.OK)
          .json({ message: MESSAGES.OTP_RESEND_SUCCESS , resend: true });
      }
    }

    if (!userData.otp) {
      let newSecretOTP = generateNewOTP();
      let otpExpires = Date.now() + 5 * 60 * 1000; // 5 minute expiry

      userData = await userSchema.findOneAndUpdate(
        { email, isOTPVerified: false },
        { otp: newSecretOTP, otpExpires },
        { new: true }
      );

      const mailOptions = nodemailer.mailCreator(userData);
      await nodemailer.transporter.sendMail(mailOptions);

      req.session.resendOTPafter = Date.now() + 60 * 1000;

      return res.status(RESPONSE_CODES.OK ).json({
        message: MESSAGES.OTP_SEND_TO_MAIL,
        success: true,
        otpExpires,
      });
    } else if (userData.otp && userData.otpExpires < Date.now()) {
      const newOTP = generateNewOTP();
      const otpExpiryTime = Date.now() + 5 * 60 * 1000;
      userData = await userSchema.findOneAndUpdate(
        { email },
        { otp: newOTP, otpExpires: otpExpiryTime },
        { new: true }
      );
      const mailOptions = nodemailer.mailCreator(userData);
      await nodemailer.transporter.sendMail(mailOptions);
      
      req.session.resendOTPafter = Date.now() + 60 * 1000; // 1 min timer
      return res
        .status(RESPONSE_CODES.CREATED)
        .json({
          message: MESSAGES.OTP_EXPIRED_GENERATED_NEWONE,
          newOTP: true,
        });
    } else {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        message: MESSAGES.OTP_ALREADY_CREATED_PLEASE_WAIT ,
        success: false,
      });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR ).json({ message: MESSAGES.INTERNAL_SERVER_ERROR, success: false });
  }
};


const getOTPTimer = async (req, res) => {
  try {
    const resendOTPafter = req.session.resendOTPafter;
    const remainingTime = Math.max(0, resendOTPafter - Date.now());
    return res.status(RESPONSE_CODES.OK).json({ success: true, remainingTime });
  } catch (error) {
    console.error("Error fetching OTP timer:", error);
    return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR ).json({ message: MESSAGES.INTERNAL_SERVER_ERROR, success: false });
  }
};

const viewForgotPassword = async (req, res) => {
  res.render("users/forgotPassword");
};

const findUserAccount = async (req, res) => {
  try {
    const { email } = req.body;
    const userData = await userSchema.findOneAndUpdate(
      { email },
      { isOTPVerified: false },
      { new: true }
    );
    if (!userData)
      return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.USER_NOT_FOUND });
    req.session.userEmail = email;
    req.session.forgetPassword = true;
    return res.status(RESPONSE_CODES.OK).json({ message: MESSAGES.ACCOUNT_FOUND, success: true });
  } catch {
    return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

const viewSetPassword = async (req, res) => {
  try{
  userId = req.session.user;
  const userData = await userSchema.findById(userId);
  if (!userData) return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.USER_NOT_FOUND });
  res.render("users/setPassword", { userData });
}catch(error){
  console.log(error)
  res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message:MESSAGES.INTERNAL_SERVER_ERROR})
}}

const updatePassword = async (req, res) => {
  try {
    const userId = req.session.user;
    const { email, password, confirmPassword } = req.body;

    if (password == "" || confirmPassword == "")
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.PASSWORD_CANNOT_BE_EMPTY });

    if (password !== confirmPassword)
      return res
        .status(RESPONSE_CODES.BAD_REQUEST)
        .json({ message: MESSAGES.PASSWORDS_NOT_MATCHING , success: false });
    const user = await userSchema.findOne({ email });

    const passwordStrength = isStrongPassword(password);
    if (!passwordStrength)
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        message: MESSAGES.PASSWORD_NOT_STRONG,
        success: false,
      });

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await userSchema.findByIdAndUpdate(
      userId,
      { hashedPassword },
      { new: true }
    );
    return res
      .status(RESPONSE_CODES.OK )
      .json({
        message: MESSAGES.PASSWORD_CHANGE_SUCCESS ,
        success: true,
      });
  } catch (error) {
    console.log(error);
    res.status(RESPONSE_CODES.BAD_REQUEST).json({message:MESSAGES.BAD_REQUEST})
  }
};

const googleUserProfile = async (req, res) => {
  const userData = req.session.user;
  res.render("users/profile", { userData });
};

const editPassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword, confirmNewPassword } =
      req.body;
    const userId = req.session._id;
    const user = await userSchema.findOne({
      _id: userId,
      email,
      isBlocked: false,
      isOTPVerified: true,
    });
    if (!user) return res.status(RESPONSE_CODES.NOT_FOUND).json({ message: MESSAGES.USER_NOT_FOUND });
    if (!user.hashedPassword)
      return res
        .status(RESPONSE_CODES.BAD_REQUEST)
        .json({ message: MESSAGES.YOU_ARE_NOT_AUTHORISED_TO_CHANGE_PASSWORD });
    if (newPassword !== confirmNewPassword)
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.PASSWORDS_NOT_MATCHING });
    const isMatchPassword = await bcrypt.compare(
      currentPassword,
      user.hashedPassword
    );
    if (!isMatchPassword)
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.INCORRECT_CURRENT_PASSWORD });
    const isPasswordStrong = isStrongPassword(newPassword);
    if (!isPasswordStrong)
      return res
        .status(RESPONSE_CODES.BAD_REQUEST)
        .json({ message: MESSAGES.PASSWORD_NOT_STRONG });
    const newHashPassword = await bcrypt.hash(newPassword, 10);
    user.hashedPassword = newHashPassword;
    await user.save();
    return res.status(RESPONSE_CODES.OK).json({ message: MESSAGES.PASSWORD_CHANGE_SUCCESS });
  } catch (err) {
    console.log(err);
    return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR ).json({ message: `server error: ${err}` });
  }
};

const updateAccount = async (req, res) => {
  try{
  const userId = req.session._id;
  const { name, phone } = req.body;
  const user = await user.findOne({
    _id: userId,
    isBlocked: false,
    isOTPVerified: true,
  });
}catch(error){
  console.log(error)
  
}}

const addUserImage = async (req, res) => {
  try{
  const userId = req.session._id;
  const avatar = req.file.path;
  const user = await userSchema.findOne({
    _id: userId,
    isBlocked: false,
    isOTPVerified: true,
  });
  if (!user) return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.USER_NOT_FOUND });
  user.avatar = avatar;
  await user.save();
  return res.status(RESPONSE_CODES.OK).json({ message: MESSAGES.PROFILE_IMAGE_UPDATE_SUCCESS });
}catch(error){
  console.log(error)
  res.status(RESPONSE_CODES.BAD_REQUEST).json({message:MESSAGES.PROFILE_IMAGE_UPDATE_FAILED})
}}

const editUserDetails = async (req, res) => {
  try {
    const userId = req.session._id;
    const { name, phone } = req.body;

    // Validate the inputs first
    if (!validateName(name)) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.INVALIID_NAME_FORMAT  });
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.INVALID_MOBILE_NUMBER });
    }

    // Find the user
    const user = await userSchema.findOne({
      _id: userId,
      isBlocked: false,
      isOTPVerified: true,
    });

    if (!user) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.USER_NOT_FOUND });
    }

    let changes = false;

    if (user.name !== name) {
      user.name = name;
      changes = true;
    }

    if (user.phone !== phone) {
      user.phone = phone;
      changes = true;
    }

    if (!changes) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.NO_CHANGES_FOUND });
    }

    await user.save();
    return res
      .status(RESPONSE_CODES.OK)
      .json({ success: true, message: MESSAGES.USER_DATA_CHANGE_SUCCESS });
  } catch (err) {
    console.log(err);
    return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR ).json({ message: `Server error: ${err.message}` });
  }
};

module.exports = {
  userLogin, 
  errorPage,
  signUp,
  aboutPage,
  signIn,
  createUser,
  userProfile,
  logout,
  verifyOTP,
  sendOTPtoEmail,
  viewOTPpage,
  getOTPTimer,
  viewForgotPassword,
  findUserAccount,
  viewSetPassword,
  updatePassword,
  googleUserProfile,
  editPassword,
  updateAccount,
  addUserImage,
  editUserDetails,
}
