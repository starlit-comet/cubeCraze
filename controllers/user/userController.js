const userSchema = require("../../models/userSchema");
const referalcouponSchema = require("../../models/referalCouponSchema");
const bcrypt = require("bcrypt");
//const saltRound=process.env.SALTROUND
const nodemailer = require("../../helpers/nodemailer");
const couponGenerator = require("../../helpers/generateUniquesVal"); // same fn as referal generator
const { validate } = require("uuid");

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
    res.render("users/login");
  } catch (error) {
    console.log(error);
    res.status(500).redirect("/pagenotfound");
  }
};
const errorPage = async (req, res) => {
  try {
    res.render("users/pagenotfound");
  } catch (error) {
    console.log(error);
  }
};

const signUp = async (req, res) => {
  try {
    // const referralCode = req.query.referral ? req.query.referral : ''
    // console.log(referralCode,'refCode')
    res.render("users/signUp");
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
    //  console.log(req.body)
    const { email, password } = req.body;
    const user = await userSchema
      .findOne({ email, googleId: "noGoogleId", isBlocked: false })
      .sort();
    // console.log(user)
    if (!user) return res.status(200).json({ message: "email not found" });

    const isMatchPassword = await bcrypt.compare(password, user.hashedPassword);
    //console.log(isMatchPassword)
    if (!isMatchPassword)
      return res
        .status(200)
        .json({ message: "passwords not matching", success: false });
    if (!user.isOTPVerified) {
      // console.log(`user otp not verified`)
      req.session.userEmail = user.email;
      return res
        .status(200)
        .json({
          message: "User is Not OTP verified redirecting to verify otp",
          success: false,
          redirectOTP: true,
        });
    }
    if (isMatchPassword) {
      //  console.log(`user login success`)
      req.session._id = user._id;
      return res
        .status(202)
        .json({ message: "Login SuccesFull", success: true });
    } else res.send("password not matching");
  } catch (error) {
    console.log(error);
  }
};
const createUser = async (req, res) => {
  try {
    // console.log(req.body)
    const referalCode = await couponGenerator.generateUniqueCode();
    const {
      email,
      name,
      password,
      confirmPassword,
      referralCode,
      haveReferralCode,
    } = req.body;
    //console.log(referralCode,'passed to body',console.log(req.body),haveReferralCode)
    if (name == "")
      return res.status(200).json({ message: "Name cannot be empty" });
    const user = await userSchema.findOne({ email });
    if (user)
      return res
        .status(200)
        .json({ message: "User already exists", success: false });
    if (password == "" || confirmPassword == "")
      return res.status(200).json({ message: "Passwords cannot be empty" });
    if (password !== confirmPassword)
      return res
        .status(200)
        .json({ message: "passwords not Matching", success: false });
    const passwordStrength = isStrongPassword(password);
    if (!passwordStrength)
      return res.status(200).json({
        message: `Password Not Strong, kindly incluede a Captial letter, a small letter, a symbol, a number
             ,a special character. Password should have length of 8`,
        success: false,
      });
    // console.log(process.env.SALTROUND)
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
          .status(400)
          .json({
            message:
              "Referal Code not Valid kindly try another or give it as empty",
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
      .status(200)
      .json({
        message: "New Account Created Please verify OTP to continue",
        success: true,
      });
  } catch (error) {
    console.log(error);
  }
};
const userProfile = (req, res) => {
  // const user = req.session.user

  if (!req.user) return res.redirect("/login");
  // console.log(req.user,'requser')
  req.session._id = req.user._id;
  res.redirect("/home");
};
const logout = (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect("/home");
    });
  });
};

const viewOTPpage = async (req, res) => {
  //  req.session.userEmail = 'akshaitr031@gmail.com'
  const email = req.session.userEmail;
  const newUser = await userSchema.findOne({ email }).select("name email -_id");
  res.render("common/generateOTP", { newUser });
};

const verifyOTP = async (req, res) => {
  const { otp, emailFromFront } = req.body;
  const userEmail = req.session.userEmail;
  const forgetPassword = req.session.forgetPassword;

  // const referalCode = req.session.referalCode
  // if(email!==emailFormFront) return res.status(200).json({message:'email error',success:false})

  //var userEmail = user.email
  console.log(`otp from page: ${otp}`);
  console.log(`user data:${userEmail}`);
  if (!otp) {
    return res
      .status(200)
      .json({ success: false, message: "OTP is required." });
  }
  let userData = await userSchema.findOne({ email: userEmail });
  if (otp === userData.otp && userData.otpExpires > Date.now()) {
    //   let newCoupon = couponGenerator.generateUniqueCode()

    userData = await userSchema.findByIdAndUpdate(
      userData._id,
      { isOTPVerified: true, otp: null, otpExpires: null },
      { new: true }
    );

    req.session.user = userData._id;

    if (forgetPassword) {
      return res
        .status(200)
        .json({
          message: "redirecting to password page",
          forgetPassword: true,
        });
    }

    return res.status(200).json({ success: true, message: "otp verified" });
  } else if (userData.otpExpires <= Date.now()) {
    console.log(`otp matched but its expired`);
    await userSchema.findByIdAndUpdate(userData._id, {
      otp: null,
      otpExpires: null,
    });
    return res
      .status(200)
      .json({
        message: "Otp expired Kindly,click send OTP to Generate a new one",
        success: false,
      });
  } else if (otp !== userData.otp && userData.otpExpires > Date.now()) {
    return res
      .status(200)
      .json({ message: "OTP not matching", success: false });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Incorrect OTP. Please try again." });
  }
};

const sendOTPtoEmail = async (req, res) => {
  try {
    const email = req.session.userEmail;
    let userData = await userSchema.findOne({ email });
    if (userData.isOTPVerified == true)
      return res
        .status(200)
        .json({ success: false, message: "User Already Verified" });
    const resendOTPafter = req.session.resendOTPafter;
    // console.log('hiiehq2',resendOTPafter);
    if (resendOTPafter && userData.otpExpires > Date.now()) {
      if (resendOTPafter >= Date.now())
        return res
          .status(200)
          .json({
            success: false,
            message: "kindly wait for some time to redend the otp",
          });
      else if (resendOTPafter < Date.now()) {
        let userData = await userSchema.findOne({ email });
        const mailOptions = nodemailer.mailCreator(userData);
        await nodemailer.transporter.sendMail(mailOptions);
        console.log("otp resent success");
        req.session.resendOTPafter = Date.now() + 60 * 1000;
        return res
          .status(200)
          .json({ message: "Otp resend success", resend: true });
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
      console.log("Mail sent");

      req.session.resendOTPafter = Date.now() + 60 * 1000;

      return res.status(200).json({
        message: "OTP sent to mail id",
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
      console.log(
        "otp expired hence creating a new otp and updating expiry time"
      );
      req.session.resendOTPafter = Date.now() + 60 * 1000; // 1 min timer
      return res
        .status(200)
        .json({
          message:
            "Otp Expired, Hence generated a new OTP and sent it to your mail",
          newOTP: true,
        });
    } else {
      return res.status(200).json({
        message: "OTP already created, please wait before resending",
        success: false,
        //otpExpires: userData.otpExpires
      });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const googleSignin = async (req, res) => {};

const getOTPTimer = async (req, res) => {
  try {
    // const email = req.session.userEmail;
    // let userData = await userSchema.findOne({ email, isOTPVerified: false });

    // if (!userData) {
    //     return res.status(400).json({ success: false, message: "User not found" });
    // }
    const resendOTPafter = req.session.resendOTPafter;
    const remainingTime = Math.max(0, resendOTPafter - Date.now());
    // console.log('tiem',remainingTime)
    return res.status(200).json({ success: true, remainingTime });
  } catch (error) {
    console.error("Error fetching OTP timer:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const viewForgotPassword = async (req, res) => {
  res.render("users/forgotPassword");
};

const findUserAccount = async (req, res) => {
  try {
    const { email } = req.body;
    //  console.log(email)
    const userData = await userSchema.findOneAndUpdate(
      { email },
      { isOTPVerified: false },
      { new: true }
    );
    if (!userData)
      return res.status(200).json({ message: "User Account Not Found" });
    req.session.userEmail = email;
    req.session.forgetPassword = true;
    //userData = await userSchema.findOneAndUpdate()
    return res.status(200).json({ message: "Account Found", success: true });
  } catch {
    return res.status(400).json({ message: "Server error" });
  }
};

const viewSetPassword = async (req, res) => {
  userId = req.session.user;
  //console.log(userId)
  const userData = await userSchema.findById(userId);
  if (!userData) return res.status(200).json({ message: "User not found" });
  res.render("users/setPassword", { userData });
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.session.user;
    const { email, password, confirmPassword } = req.body;
    //console.log(userId,email,password,confirmPassword)

    if (password == "" || confirmPassword == "")
      return res.status(200).json({ message: "Passwords cannot be empty" });

    if (password !== confirmPassword)
      return res
        .status(200)
        .json({ message: "passwords not Matching", success: false });
    const user = await userSchema.findOne({ email });

    const passwordStrength = isStrongPassword(password);
    if (!passwordStrength)
      return res.status(200).json({
        message: `Password Not Strong, kindly incluede a Captial letter, a small letter, a symbol, a number
             ,a special character. Password should have length of 8`,
        success: false,
      });

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await userSchema.findByIdAndUpdate(
      userId,
      { hashedPassword },
      { new: true }
    );
    console.log(`password changed`);
    return res
      .status(200)
      .json({
        message: "Your Password Has been Changed Succesfully",
        success: true,
      });
  } catch (error) {
    console.log(error);
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
    if (!user) return res.status(404).json({ message: "User Not Found" });
    // console.log(user)
    if (!user.hashedPassword)
      return res
        .status(400)
        .json({ message: "You are Not authorised to change password" });
    if (newPassword !== confirmNewPassword)
      return res.status(400).json({ message: "Passwords Not Matching" });
    const isMatchPassword = await bcrypt.compare(
      currentPassword,
      user.hashedPassword
    );
    if (!isMatchPassword)
      return res.status(400).json({ message: "Current Password is Incorrect" });
    const isPasswordStrong = isStrongPassword(newPassword);
    if (!isPasswordStrong)
      return res
        .status(400)
        .json({ message: "Your New Password is not strong" });
    const newHashPassword = await bcrypt.hash(newPassword, 10);
    user.hashedPassword = newHashPassword;
    await user.save();
    return res.status(200).json({ message: "password Updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: `server error: ${err}` });
  }
};

const updateAccount = async (req, res) => {
  const userId = req.session._id;
  const { name, phone } = req.body;
  const user = await user.findOne({
    _id: userId,
    isBlocked: false,
    isOTPVerified: true,
  });

  //  console.log(req.body,userId)
};

const addUserImage = async (req, res) => {
  const userId = req.session._id;
  const avatar = req.file.path;
  const user = await userSchema.findOne({
    _id: userId,
    isBlocked: false,
    isOTPVerified: true,
  });
  if (!user) return res.status(400).json({ message: "user Not Found" });
  user.avatar = avatar;
  await user.save();
  console.log(avatar, "je");
  return res.status(200).json({ message: "Profile Image Updated" });
};

const editUserDetails = async (req, res) => {
  try {
    const userId = req.session._id;
    const { name, phone } = req.body;

    // Validate the inputs first
    if (!validateName(name)) {
      return res.status(400).json({ message: "Invalid name format" });
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Find the user
    const user = await userSchema.findOne({
      _id: userId,
      isBlocked: false,
      isOTPVerified: true,
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
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
      return res.status(200).json({ message: "No changes detected" });
    }

    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "User details changed successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
};

module.exports = {
  userLogin,
  errorPage,
  signUp,
  aboutPage,
  signIn,
  createUser,
  googleSignin,
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
};
