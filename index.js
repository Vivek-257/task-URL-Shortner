require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const { connectToDatabase } = require('./src/utils/db.js');
const urlRoutes = require('./src/routes/urlRoutes.js');
const { isAuth } = require('./src/middlewares/auth');

const app = express();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-default-secret';
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For handling form data

// Set up views and static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Session and Passport setup
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api', urlRoutes); // Routes for API endpoints

// Passport Google OAuth2 Strategy
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  console.log('Google profile:', profile);
  return done(null, profile);
}));


  
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Home route
// app.get('/', (req, res) => {
//   if (req.isAuthenticated()) {
//     res.render('index', { shortUrl: null, error: null, user: req.user });
//   } else {
//     res.render('login');
//   }
// });

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        console.log("request.user", req.user);
        
      res.render('index', { shortUrl: null, error: null, userId:req.user.id });
    } else {
      res.render('login');
    }
  });



  

// Google OAuth login
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => res.redirect('/')
);

// Logout route
app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      console.error('Error during logout:', err);
      return res.redirect('/');
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // Clear session cookie
      res.redirect('/'); // Redirect to login page
    });
  });
});

// Database connection and server start
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to connect to database', err);
});
