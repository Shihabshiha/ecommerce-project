var express = require('express');
const { route } = require('./users');
var router = express.Router();
const adminHelper=require('../helpers/adminHelpers')
const adminController=require('../controllers/admin-controller')
const session_check=require('../middlewares/sessionHandler')
const upload=require('../middlewares/multerCloudinary')


// admin login page render 
router.get('/',session_check.adminLogged,adminController.adminDashboard ); 

//admin login page load 
router.route('/admin-login')
.get(session_check.adminCheck,adminController.adminLogin)
.post(adminController.adminLoginPost)

//admin logout
router.route('/admin-logout')
.get(adminController.adminLogout);


//Getting user details
router.route('/users').get(session_check.adminLogged,adminController.userDetails);


//User block
router.get('/user-block/:id',adminController.userBlock);

//User unblock
router.get('/user-unblock/:id',adminController.userUnblock);

//Listing all products in admin side
router.get('/all-product',session_check.adminLogged,adminController.productListing); 

//Add products
router.route('/add-product')
.get(session_check.adminLogged, adminController.addProduct)

router.post('/add-product', upload, adminController.addProductPost)

//Edit product
router.get('/edit-product/:id',session_check.adminLogged,adminController.editProduct)

router.post('/edit-product/:id',adminController.editProductPost);

//Delete product
router.get('/delete-product/:id',session_check.adminLogged,adminController.deleteProduct);

//get category management page
router.route('/category').get(session_check.adminLogged,adminController.getCategory);

//add category
router.route('/add-category').post(adminController.addCategory);

//delete Category
router.route('/delete-category/:id').get(adminController.deleteCategory);

//view order list
router.route('/order-list').get(session_check.adminLogged,adminController.getOrderList);

//Status change of orders
router.route('/change-status').post(adminController.updateOrderStatus);

//order- dertails
router.route('/order-details/:id').get(session_check.adminLogged,adminController.orderDetails)

//coupen management page loading
router.route('/coupon')
.get(session_check.adminLogged,adminController.getCouponPage)
.post(adminController.addCoupon)

//return order managment
router.route('/return-item')
.get(session_check.adminLogged,adminController.getReturnRequest)
.post(adminController.returnApproval)

//get the sales report
router.route('/sales-report').get(session_check.adminLogged,adminController.getSalesReport)

//download sales report
router.route('/sales-reportDownload').get(adminController.salesReportDownload)

module.exports = router;
