
const isAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }

    console.log('User is not authenticated, redirecting to /auth/google');
    res.redirect('/auth/google'); 
  };
  
  module.exports = { isAuth };
  

  



