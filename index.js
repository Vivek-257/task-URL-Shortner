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

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api', urlRoutes); 


const callbackURL = process.env.NODE_ENV === 'production'
  ? 'https://task-url-shortner-git-master-vivek-sharmas-projects-bb4e4fe9.vercel.app/auth/google/callback'
  : 'http://localhost:3000/auth/google/callback';
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: callbackURL,
}, (accessToken, refreshToken, profile, done) => {
  console.log('Google profile:', profile);
  return done(null, profile);
}));


  
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));



app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        console.log("request.user", req.user);
        
      res.render('index', { shortUrl: null, error: null, userId:req.user.id });
    } else {
      res.render('login');
    }
  });



  

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => res.redirect('/')
);

app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      console.error('Error during logout:', err);
      return res.redirect('/');
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); 
      res.redirect('/'); 
    });
  });
});

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to connect to database', err);
});
