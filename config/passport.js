const passport = require('passport');
const referalGenerator = require('../helpers/generateUniquesVal')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const session = require('express-session')
const User = require('../models/userSchema'); // Your Mongoose user model
require('dotenv').config();
passport.session( { secret: process.env.SESSION_SECRET,
    resave:true,
    saveUninitialized:true,})

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback'
        },
        async  (accessToken, refreshToken, profile, done) => {
            
          //  console.log("Google Profile ID:", profile);
            try {
                const referalCode = await referalGenerator.generateUniqueCode()
                let user = await User.findOne({ googleId: profile.id });
                if(user && user.isBlocked==true) return done(null,false,{message:'User is Blocked',userBlocked:true})
                if (!user) {
                    user = new User({
                      //_id:new mongoose.Types.ObjectId(),
                        googleId: profile.id,  
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        avatar: profile.photos[0].value,
                        isOTPVerified:true,otp:null,
                        referalCode
                    });
                    await user.save();
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (_id, done) => {
    try {
        const user = await User.findById({_id});
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});





// passport.use( new GoogleStrategy({
//     clientID:process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL:"http://localhost:3232/auth/google/callback",
    
// },async (accessToken,refreshToken,profile,done)=>{
//     try {
//        // console.log("Google Profile:", profile); // Debugging
        
//         let user = await User.findOne({ googleId: profile.id });

//         if (!user) {
//             user = new User({
//                 googleId: profile.id.toString(), // Ensure it's a string
//                 name: profile.displayName,
//                 email: profile.emails?.[0]?.value || null,
//                 avatar: profile.photos?.[0]?.value || null
//             });
//             await user.save();
//         }
//         return done(null, user);
//     } catch (err) {
//         return done(err, null);
//     }
// }))