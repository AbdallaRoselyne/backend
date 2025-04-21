const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");
const bcrypt = require("bcryptjs");

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      // Domain restriction
      if (!email.endsWith("@prodesign.mu")) {
        return done(null, false, {
          message: "Access restricted to @prodesign.mu users",
        });
      }

      try {
        let user = await User.findOne({ email });

        // Auto-create user if not exists
        if (!user) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const role =
            email === "farahnaz.sairally@prodesign.mu" ||
            email === "planner@prodesign.mu"
              ? "admin"
              : "user";
          user = new User({ email, password: hashedPassword, role });
          await user.save();
        }

        // Password verification
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
