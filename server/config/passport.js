import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const avatar = profile.photos[0]?.value || null;

        // Check if user exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) return done(null, user);

        // Check if email already registered manually
        user = await User.findOne({ email });

        if (user) {
          // Link Google to existing account
          user.googleId = profile.id;
          user.avatar = avatar;
          user.emailVerified = true;
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: email,
          googleId: profile.id,
          avatar: avatar,
          emailVerified: true,
          password: null,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
