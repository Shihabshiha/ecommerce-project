const db = require("../config/connections");
const collection = require("../config/collections");
const { ObjectId } = require("mongodb");



module.exports={
  //user login and signup session cheking
  authenticationCheck: (req,res,next)=>{
    if(req.session.user){
      res.redirect('/');
    }else{
      next(); 
    }
  },

  //user session check in home page
  userCheck: (req, res, next) => {
    if (req.session.user) {
      let userId = req.session.user._id; // Assuming the user ID is stored in the session
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) })
        .then((user) => {
          if (user && user.access) {
            console.log('Access checked');
            next();
          } else {
            req.session.adminBlock = 'User blocked by admin';
            req.session.user = null;
            res.redirect('/user-login');
          }
        })
        .catch((error) => {
          console.log(error);
          res.render(error)
        });
    } else {
      res.redirect('/user-login');
    }
  },
  

  // userCheck: (req, res, next) => {
  //   if (req.session.user) {
  //     let userId = req.session.user._id; // Assuming the user ID is stored in the session
  //     db.get()
  //       .collection(collection.USER_COLLECTION)
  //       .findOne({ _id: ObjectId(userId) })
  //       .then((user) => {
  //         if (user && user.access) {
  //           console.log('Access checked');
  //           next();
  //         } else {
  //           req.session.adminBlock = 'User blocked by admin';
  //           req.session.user = null;
  //           if (req.method === 'GET') {
  //             res.redirect('/user-login');
  //           } else {
  //             res.status(401).json({ message: 'User blocked by admin' });
  //           }
  //         }
  //       })
  //       .catch((error) => {
  //         console.log(error);
  //         res.redirect('/user-login');
  //       });
  //   } else {
  //     if (req.method === 'GET') {
  //       res.redirect('/user-login');
  //     } else {
  //       res.status(401).json({ message: 'User not logged in' });
  //     }
  //   }
  // },
  
  

  //checking admin is logged or not to render dashboard
  adminCheck:(req,res,next)=>{
    if(req.session.admin){
      res.redirect('/admin')
    }else{
      next()
    }
  },

  //checking admin is present or not to load login page
  adminLogged:(req,res,next)=>{
    if(req.session.admin){
      next()
    }else{
      res.redirect('/admin/admin-login')
    }
  }

}