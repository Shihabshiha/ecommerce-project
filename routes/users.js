var express = require('express');
// const { response } = require('../app');
var router = express.Router();
var userHelper=require('../helpers/userHelpers')
const userController=require('../controllers/user-controller')
const session_check=require('../middlewares/sessionHandler')
const pageController=require('../controllers/page-controller')




/* GET home page. */
router.get('/', userController.homePage);

//User login page loading 
router.route('/user-login')
.get(session_check.authenticationCheck, userController.loginPage)
.post(userController.loginPost)

//otp page rendering
router.route('/otp-login')
.get(userController.otpLogin)
.post(userController.otpLoginPost);

//otp verification and reroute to home page
router.route('/otp-verify')
.get(userController.otpVerifyGet)
.post(userController.otpVerify);


//User Signup page loading 
router.route('/signup')
.get(session_check.authenticationCheck, userController.userSignup)
.post(userController.signupPost);

//User logout
router.route('/user-logout')
.get(userController.userLogout);

//shop page loading
router.route('/shop-page')
.get( pageController.shopPage);

//search products
router.route('/search-product')
.get(pageController.searchProducts);

//category wise page 
router.route('/category-page/:id')
.get( pageController.CategoryFilterPage)

//User profile page render
router.route('/user-profile')                   
.get(session_check.userCheck, userController.userProfileDash)

//add address
router.route('/add-address')
.post(userController.addUserAddress)

//edit address
router.route('/edit-address/:id')
.get(session_check.userCheck,userController.getEditAddress)
.post(userController.postEditAddress)

router.route('/deleteAddress').post(userController.deleteAddressbyId)


//Product detail page render
router.route('/product-details/:id')
.get(pageController.productDetails)


//add items to cart
router.post('/add-to-cart', userController.addtoCart)

//view the cart
router.route('/view-cart')
.get(session_check.userCheck,userController.viewCart);

//change the quantity of product in cart
router.route('/change-quantity')
.post(userController.changeCartProductQuantity);

//remove product from cart
router.route('/removeProduct')
.put(userController.removeProductFromCart);

//checkout page loading
router.route('/check-out')
.get(session_check.userCheck,userController.getCheckoutPage)
router.post('/check-out-post',userController.postCheckout)

//add new address
router.route('/add-new-address')
.post(userController.addNewAddress);

// verify the razorpay payment
router.route('/verify-payment')
.post(userController.verifyPayment)

//order placed successfully page
router.route('/order-placed')
.get(session_check.userCheck,userController.getOrderPlaced)

//cancel order
router.post('/cancelOrder',userController.cancelOrder)

// view order list
router.route('/order-list')
.get(session_check.userCheck,userController.getOrderList)



//order details
router.route('/order-details/:id')
.get(session_check.userCheck,userController.orderDetails);

//to get available coupon for a purchase
router.route('/coupons').get(userController.getCoupons);
router.route('/apply-coupon').post(userController.applyCoupon)
router.route('/remove-coupon').post(userController.removeCouponApplied);

//return item by user
router.route('/returnItem').post(userController.returnItemByUser)


module.exports = router;
