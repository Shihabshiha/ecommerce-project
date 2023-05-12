
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

  userCheck:(req,res,next)=>{

    if(req.session.user){
      let user=req.session.user
      if(user.access){
        console.log('access checked');
        next()
      }else{
        res.redirect('/')
      }    
    }else{
      res.redirect('/')
    }
  },

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