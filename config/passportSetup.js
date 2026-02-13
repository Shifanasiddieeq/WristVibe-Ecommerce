const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/userModel');

passport.serializeUser((user, done) => {
    done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET_ID,
    callbackURL: process.env.CALLBACK_URL,
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
      
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          
            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }
        } else {
      
            const randomPassword = 'wristvibe@google'
            
            user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                isVerified: true,
                phone: '0000000000', 
                password: randomPassword 
            });
        }

        return done(null, user);
    } catch (error) {
        console.error('Google authentication error:', error);
        return done(error, null);
    }
}));
