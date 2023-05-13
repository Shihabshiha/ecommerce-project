const { response } = require('express');
const userHelpers = require('../helpers/userHelpers');
const userHelper=require('../helpers/userHelpers')
const twilio=require('../middlewares/twilio_api');
const async = require('hbs/lib/async');



module.exports ={
// home page render 
homePage: async (req, res, next) => {
  try {
    let user = req.session.user;
    let cartCount = null;
    if (user) {
      cartCount = await userHelper.getCartCount(user._id)
    }
    res.render('index', { user, "loggedOut": req.session.loggedOut, cartCount });
    req.session.loggedOut = false;
  } catch (error) {
    next(error);
  }
},

// user login page load  
loginPage: (req, res) => {
  try {
    res.render('user/user-login', { "loginErr": req.session.loginErr, "adminBlock": req.session.adminBlock });
    req.session.loginErr = false
    req.session.adminBlock = false
  } catch (error) {
    next(error);
  }
},

// submitting login form and enters to homepage
loginPost: (req, res) => {
  try {
    userHelper.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.user = response.user
        req.session.loginStatus = true

          // Check if the user has a wallet
          userHelper.checkIfUserHasWallet(response.user._id).then((walletExists) => {
            if (!walletExists) {
              // If the user doesn't have a wallet, create one
              userHelper.createWalletForUser(response.user._id).then(() => {
                console.log('Wallet created for user', response.user._id);
              }).catch((err) => {
                console.log('Error creating wallet:', err);
              });
            }
          });
        res.redirect('/')
      } else if (response.status == false) {
        req.session.loginErr = "Invalid user name or password";
        res.redirect('/user-login')
      } else {
        req.session.adminBlock = "User blocked by admin"
        res.redirect('/user-login')
      }
    })
  } catch (error) {
    next(error);
  }
},

// otp phone number page loading
otpLogin: (req, res) => {
  try {
    res.render('user/otp-login', { "mobileNoErr": req.session.numberErr });
    req.session.numberErr = false;
  } catch (error) {
    next(error);
  }
},

// otp login post method
otpLoginPost: (req, res) => {
  try {
    let mobile = req.body.mobileNo;
    userHelper.otpLogin(mobile).then((result) => {
      console.log(result);
      req.session.mobileNo = mobile;
      if (result.status) {
        twilio.generateOtp(mobile).then((response) => {
          if (response) {
            res.redirect('/otp-verify');
          } else {
            res.redirect('/otp-login');
          }
        })
      }
    }).catch((err) => {
      req.session.numberErr = 'No account is found with this number..!'
      res.redirect('/otp-login')
    })
  } catch (error) {
    next(error);
  }
},

// otp verifying
otpVerifyGet: (req, res) => {
  try {
    res.render('user/otp-page', { 'wrongOtp': req.session.wrongOtp })
    req.session.wrongOtp = false;
  } catch (error) {
    next(error);
  }
},

// otp verify post method
otpVerify: (req, res) => {
  try {
    const otp = req.body.otp
    const mobile = req.session.mobileNo
    twilio.verifyOtp(mobile, otp).then((response) => {
      if (response.valid) {
        req.session.user = response
        res.redirect('/')
      } else {
        req.session.wrongOtp = 'Entered wrong otp'
        res.redirect('/otp-verify')
      }

    })
  } catch (error) {
    next(error);
  }
},

// Render user signup page
userSignup: (req,res)=>{
  res.render('user/user-signup')
},

// Submitting the signup form to server and checking if user already exists or not
signupPost: (req,res)=>{
  try {
    userHelper.doSignup(req.body).then((data)=>{
      req.session.user=data
      res.redirect('/')
    }).catch((Err)=>{
      res.render('user/user-signup',{exists:true})
    })
  } catch (error) {
    res.status(500).send('Internal server error');
  }
},

// User logout and session destroy
userLogout:(req,res)=>{
  try {
    req.session.user=null;
    req.session.loginStatus=false;
    req.session.loggedOut="Successfully logged out"
    res.redirect('/')
  } catch (error) {
    res.status(500).send('Internal server error');
  }
},

// Add to cart
addtoCart:(req,res)=>{
  try {
    let { productId } = req.body;
    let user=req.session.user;
    let userId=user._id;
    if(user){
      userHelper.addToUserCart(userId,productId).then(()=>{
        res.json({ status: true })
      })
    }
  } catch (error) {
    res.status(500).send('Internal server error');
  }
},

// View cart
viewCart: async (req, res) => {
  try {
    let user=req.session.user;
    let userId = user._id;
    let cartCount = await userHelper.getCartCount(userId)
    const cartItems = await userHelper.getCartProduct(userId);
    const total = await userHelper.getTotalAmount(userId);
    res.render('user/shoppingCart', { cartItems, user,userId, total,cartCount});
  } catch (error) {
    res.status(500).send('Internal server error');
  }
},

// Change the quantity of product in cart
changeCartProductQuantity: (req, res) => {
  try {
    userHelpers.changeCartQuantity(req.body).then(async(response) => {
      console.log('change qty',req.body);
      response.total=await userHelper.getTotalAmount(req.body.user);
      response.subtotal = await userHelpers.findSubTotal(req.body.user)
      res.json(response);
    });
  } catch (error) {
    res.status(500).send('Internal server error');
  }
},


// Remove products from cart
removeProductFromCart:(req,res)=>{
  try {
    userHelper.removeProductFromCart(req.body).then((response)=>{
      res.json(response);
    })
  } catch (error) {
    res.status(500).send('Internal server error');
  }
},

// Checkout page rendering
getCheckoutPage:async(req,res)=>{
  try {
    let user=req.session.user;
    let cartCount = await userHelper.getCartCount(user._id)
    const cartItems= await userHelper.getCartProduct(req.session.user._id);
    let address=await userHelper.getUserAddress(user._id)
    let total=await userHelper.getTotalAmount(req.session.user._id);
    let coupons=await userHelper.getAvailableCoupon();
    res.render('user/checkout',{total,user,address,cartItems,cartCount,coupons})
  } catch (error) {
    res.status(500).send('Internal server error');
  }
},

// Render user profile page
 userProfileDash :async (req, res) => {
  try {
    let user = req.session.user;
    let page = parseInt(req.query.page) || 1;
    let limit = 10;
    const orders = await userHelper.getOrders(user._id,page,limit);
    let cartCount = await userHelper.getCartCount(user._id)
    let address = await userHelper.getUserAddress(user._id);
    let wallet=await userHelper.getWalletOfUser(user._id);
    res.render('user/user-profile', { user, address,cartCount,orders,wallet });
  } catch (error) {
    res.status(500).send('Internal server error');
  }
},

// Add user address
 addUserAddress : (req, res) => {
  try {
    let address = req.body;
    let userId = req.session.user._id;
    address.userId = userId;

    userHelper.addUserAddress(address).then(() => {
      res.redirect('/user-profile');
    });
  } catch (error) {
    res.status(500).send('Internal server error');
  }
},

//edit address
getEditAddress:async(req,res)=>{
  try{
    let id=req.params.id;
    let user=req.session.user;
    let userId=user._id;
    let address=await userHelper.getUserAddressToEdit(id);
    console.log(address);
    res.render('user/edit-address',{user,address})
  }catch(error){
    console.log(error);
    res.render('error', { message: 'Error occurred while getting address' });
  }
  

},

postEditAddress:async(req,res)=>{
   try{
    const { id } = req.params;
    const { billing_address, billing_address2, city, state, zipcode, phone, email } = req.body;
    const userId=req.session.user._id;
    await userHelper.updateAddress(id,{
      billing_address,
      billing_address2,
      city,
      state,
      zipcode,
      phone,
      email});
      res.redirect('/user-profile')
   }catch(error){
    console.log(error);
    res.render('error', { message: 'Error occurred while editing address' });
   }
},

//delete address
deleteAddressbyId: async (req, res) => {
  try {      
    const result = await userHelper.deleteAddress(req.body);
    
    if (result) {
      res.status(200).json({ status: true });
    } else {
      res.status(500).json({ status: false, message: 'Failed to delete address' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'An error occurred while deleting address' });
  }
}
,

// post checkout and placing the order
  postCheckout:async(req,res)=>{
   
   try{
    let userId=req.session.user._id;
    let user=req.session.user;
    const address=await userHelper.getDeliveryAddress(req.body.addressId);
    const products=await userHelper.getCartProductsList(userId);
    const totalCartPrice=await userHelper.getTotalAmount(userId);
    const discountedTotal=await userHelper.getDiscountedTotal(userId);
    const totalPrice = discountedTotal ? discountedTotal : totalCartPrice;
    console.log("working until here");
    userHelper.placeOrder(req.body,address,products,totalPrice,user).then((orderId)=>{
      if(req.body['payment-option']=='COD'){
        res.json({codSuccess:true})
      }else{
        
        userHelper.generateRazorpay(orderId,totalPrice).then((response)=>{
          console.log(response);
          res.json(response)
        })
      }

     
    })
   }catch(err){
    console.log(err);
    res.render('error', { message: 'Error occurred while placing order' });
   }
   
  },
// View order placed
 getOrderPlaced : (req, res) => {
  try {
    let user = req.session.user;
    res.render('user/order-Placed', { user });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Error occurred while fetching order details' });
  }
},

// Get order list page
getOrderList: async (req, res) => {
  try {
    let user = req.session.user;
    let cartCount = await userHelper.getCartCount(user._id);
    let page = parseInt(req.query.page) || 1;
    let limit = 10;
    const orders = await userHelper.getOrders(user._id, page, limit);
    const startingIndex = (page - 1) * limit + 1;
    orders.forEach((order, index) => {
      order.serialNumber = startingIndex + index;
    });
    const totalOrders = await userHelper.getTotalOrders(user._id);
    const pagination = userHelper.paginate({ current: page, count: totalOrders, limit: limit, url: '/order-list' });
    console.log('pagination',pagination);
    res.render('user/order-list', { user, orders, cartCount, pagination });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Error occurred while fetching order list' });
  }
}
,

// Verify the Razorpay payment
 verifyPayment : (req, res) => {
  try {
    console.log(req.body);
    userHelper.verifyPayment(req.body).then(() => {
      userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
        console.log('Payment successful');
        res.json({ status: true });
      });
    }).catch((err) => {
      console.error(err);
      res.json({ status: false, errMessage: 'Payment failed' });
    });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Error occurred while verifying payment' });
  }
},

//view order details
orderDetails:async(req,res)=>{
  try{
    let user=req.session.user
    let id=req.params.id;
    let orderDetails=await  userHelper.getOrderDetails(id)
    let orderProducts= await userHelper.getOrderProducts(id);
    res.render('user/order-details',{orderDetails,user,orderProducts})
  }catch(error){
    console.log(error);
    res.render('error', { message: 'Error occurred while fetching order details' });
  }
},

//cancel order by user
cancelOrder:async(req,res)=>{
  try{
    let userId=req.session.user._id;
    let paymentDetails=await userHelper.getPaymentDetails(req.body)
    let orderDetails= await userHelper.getOrderDetails(req.body.orderId)
    let orderStatus=orderDetails.status;
    let paymentMethod=paymentDetails.paymentMethod;
    let totalPrice=paymentDetails.totalPrice;
    //if payment method is online then return amount to wallet
    let returnToWallet = false; 
    if(paymentMethod=='ONLINE' && orderStatus!='pending'){
      await userHelper.returnToWalletOfUser(userId,totalPrice);
       returnToWallet = true; 
    }
    let result=await userHelper.cancelOrderByUser(req.body);
    if(result){
      res.status(200).json({ status: true, returnToWallet });
    }else{
      res.status(500).json({ status: false, message: 'Failed to cancel the order' });
    }
  }catch(error){
    console.log(error);
    res.status(500).json({ status: false, message: 'Error occurred while cancelling the order' });
  }
},

//return item by user
returnItemByUser:async(req,res)=>{
  try{
    const userId=req.session.user._id;
    const { productId, quantity , orderId, reason, orderDate} = req.body;
    // Check if item is already returned
    let isAlreadyReturned = await userHelper.checkReturnItemExist(productId, orderId);
    if (isAlreadyReturned) {  
      res.status(500).json({ status: false, message: 'Item already returned' });
    } else {
      let returnItems = await userHelper.returnedItemByuser(productId,quantity,userId,reason,orderId,orderDate);
      if (returnItems) {
        // let OrderStatus = await userHelper.updateOrderStatus(orderId);
        res.status(200).json({ status: true });
      } else {
        res.status(500).json({ status: false, message: 'Failed to return item' });
      }
    }

  }catch(error){
    console.log(error);
    res.status(500).send("Error occured while return item");
  }
},


//to get coupons
getCoupons:async(req,res)=>{
  try{
    let coupons=await userHelper.getAvailableCoupon();
    res.json({ coupons: coupons });

  }catch(error){
    console.log(error);
    res.render('error', { message: 'Error occurred while fetching coupon details' });
  }
},

//appliying the coupon
applyCoupon:async(req,res)=>{
  try{
    const userId=req.session.user._id
    const {couponCode:couponCode}=req.body;
    console.log('our',userId);
    console.log(couponCode);
    let totalAmount=await userHelper.getTotalAmount(userId);
    const coupon= await userHelper.getCouponDetails(couponCode);
    console.log(coupon);

    // If coupon not found, return an error message
    if(!coupon){
      return res.status(400).json({error: 'Invalid coupon code'})
    }

    // Check if the coupon is valid (not expired)
    const currentDate = new Date();
    if (currentDate < new Date(coupon.startingDate) || currentDate > new Date(coupon.expirationDate)) {
      return res.status(400).json({ error: 'Coupon is expired' });
    }

    // Check if the user has already used this coupon
    const user = await userHelper.getUserDetails(userId);
    console.log(user)
    if (user && user.usedCoupons && user.usedCoupons.includes(couponCode)) {
      return res.status(400).json({ error: 'You have already used this coupon' });
    }


     // Check if the order amount is greater than the required minimum purchase limit.
     if (totalAmount < coupon.requiredMinPurchaseLimit) {
      return res.status(400).json({ error: `Minimum order amount for this coupon is ${coupon.requiredMinPurchaseLimit}` });
    }

     // Apply the coupon discount
     let discountAmount = totalAmount * (coupon.discountPercentage / 100);
     if (discountAmount > coupon.maxRedeemableAmount) {
       discountAmount = coupon.maxRedeemableAmount;
     }

    // Add the coupon code to the user's used coupons array
    await userHelper.pushCouponToUser(userId,couponCode);

    let discountedTotal= totalAmount-discountAmount;
    await userHelper.discountedPrice(discountedTotal,userId);
    

     
     // Return the discount amount
    res.json({ discountAmount });
  }catch(error){
    console.log(error);
    res.status(500).json({ error: 'Error occurred while applying coupon' });
  }
}


}