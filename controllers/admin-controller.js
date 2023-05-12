const async = require('hbs/lib/async');
const adminHelper=require('../helpers/adminHelpers')
const userHelper=require('../helpers/userHelpers')
const dashboardHelper=require('../helpers/dashboardHelper')
const moment = require('moment');
const productHelper = require('../helpers/productHelpers');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

module.exports={

  //admin login page render

  adminLogin: async (req, res, next) => {
    try {
      let admin = req.session.admin;
      res.render('admin/admin-login', { admin_header: true, 'adminLoginErr': req.session.adminLoginErr, admin });
      req.session.adminLoginErr = false;
    } catch (err) {
      next(err);
    }
  },
  

 // Verify admin login credentials
adminLoginPost: async (req, res) => {
  try {
    adminHelper.adminLogin(req.body).then((data) => {
      req.session.admin = data;
      console.log('admin login success');
      res.redirect('/admin')
    }).catch((err) => {
      console.log(err);
      req.session.adminLoginErr = "invalid email or password";
      console.log('login error');
      res.redirect('/admin/admin-login')
    })
  } catch (err) {
    next(err);
  }
},

//admin logout
adminLogout:(req,res)=>{
  try {
    req.session.admin=null;
    req.session.loginStatus=false;
    req.session.loggedOut="Successfully logged out"
    res.redirect('/admin')
  } catch (error) {
    res.status(500).send('Internal server error');
  }
},


 // Load admin dashboard
adminDashboard:async(req, res, next) => {
  try {
    let admin = req.session.admin
    const MonthlytotalRevenue=await dashboardHelper.getMonthlyTotalRevenue();
    const pendingOrders=await dashboardHelper.getPendingOrders();
    const productCount=await dashboardHelper.getTotalProductCount();
    const monthlyProfit=MonthlytotalRevenue*0.2;
    const categoryWiseSales= await dashboardHelper.getCategoryWiseSales();
    const paymentMethodSales = await dashboardHelper.getPaymentMethodSales();
    const weeklySales=await dashboardHelper.getWeeklySales();
    res.render('admin/dashboard', { admin_header: true, admin ,
      MonthlytotalRevenue,
      pendingOrders,
      productCount,
      monthlyProfit,
      categoryWiseSales,
      paymentMethodSales,
      weeklySales
    })
  } catch (err) {
    next(err);
  }
},

  

// Get all user details
userDetails: async (req, res, next) => {
  try {
    let admin = req.session.admin;
    let page = parseInt(req.query.page) || 1;
    let limit = 10;

    const userDetails=await adminHelper.userDetails(page,limit);
    const totalUsersCount=await adminHelper.getAllUsersCount();
    console.log('count',totalUsersCount);
    const startingIndex = (page - 1) * limit + 1;
    userDetails.forEach((userDetails, index) => {
      userDetails.serialNumber = startingIndex + index;
    });

    const pagination = userHelper.paginate({ current: page, count: totalUsersCount, limit: limit, url: '/admin/users' });
    console.log('paggg',pagination);
    res.render('admin/users', { userDetails, admin, admin_header: true ,pagination});
    
  } catch (err) {
    next(err);
  }
},

// Block user
userBlock: async (req, res, next) => {
  try {
    let id = req.params.id
    adminHelper.userBlock(id).then((status) => {
      res.redirect('/admin/users');
    })
  } catch (err) {
    next(err);
  }
},

// Unblock user
userUnblock: async (req, res, next) => {
  try {
    let id = req.params.id
    adminHelper.userUnblock(id).then((status) => {
      if (status) {
        res.redirect('/admin/users')
      }
    })
  } catch (err) {
    next(err);
  }
},

 
// Product listing page render
productListing: async (req, res, next) => {
  try {
    let admin = req.session.admin
    let page = parseInt(req.query.page) || 1;
    let limit = 10;

    const product=await adminHelper.getAllProducts(page, limit)
    const totalProductsCount= await productHelper.getTotalProductsCount();
    const pagination = userHelper.paginate({ current: page, 
                       count: totalProductsCount, limit: limit, url: '/admin/all-product' });
    res.render('admin/all-products', { admin, product, admin_header: true ,pagination});
    
  } catch (err) {
    next(err);
  }
},

// Add product page loading
addProduct: async (req, res, next) => {
  try {
    let admin = req.session.admin
    adminHelper.getAllCategory().then((category) => {
      res.render('admin/add-product', { admin, admin_header: true, category });
    })
  } catch (err) {
    next(err);
  }
},

// Add product form submit
addProductPost: async (req, res, next) => {
  try {
    adminHelper.addProducts(req.body, req.files).then((result) => {
      res.redirect('/admin/all-product')
    })
  } catch (err) {
    next(err);
  }
},

// Editing the product
editProduct: async (req, res, next) => {
  try {
    let id = req.params.id;
    let admin = req.session.admin
    const categories = await adminHelper.getAllCategory();
    adminHelper.editProduct(id).then((productInfo) => {
      console.log(productInfo);

      res.render('admin/edit-product', { productInfo, admin_header: true, admin, categories })
    })
  } catch (err) {
    next(err);
  }
},


 // Edit product updating to list 
editProductPost: async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = {
      product_name: req.body.product_name,
      product_description: req.body.product_description,
      price: parseFloat(req.body.price),
      category_name: req.body.category_name,
      createdAt: new Date()
    };
    await adminHelper.productUpdate(id, obj);
    res.redirect('/admin/all-product');
  } catch (error) {
    next(error);
  }
},

// Delete product 
deleteProduct: (req, res, next) => {
  try {
    let id = req.params.id;
    adminHelper.deleteProduct(id).then((delproduct) => {
      res.redirect('/admin/all-product');
    });
  } catch (error) {
    next(error);
  }
},

// Get all category page render
getCategory: async (req, res) => {
  try {
    let admin = req.session.admin;
    const category = await adminHelper.getAllCategory();
    res.render('admin/category', { admin_header: true, admin, category });
  } catch (error) {
    next(error);
  }
},

// Add category
addCategory: (req, res) => {
  try {
    const { category_name } = req.body;
    const name = category_name.toLowerCase();
    adminHelper.addCategory(name)
      .then(() => {
        res.redirect('/admin/category');
      })
      .catch((error) => {
        let admin = req.session.admin;
        adminHelper.getAllCategory().then((category) => {
          res.render('admin/category', { admin_header: true, admin, 
            category, error: error.message });
        });
      });
  } catch (error) {
    next(error);
  }
},

// Delete category
deleteCategory: (req, res) => {
  try {
    let id = req.params.id;
    adminHelper.deleteCategory(id).then(() => {
      res.redirect('/admin/category');
    });
  } catch (error) {
    next(error);
  }
},

// View order list
getOrderList: async (req, res) => {
  try {
    let admin = req.session.admin;
    let page = parseInt(req.query.page) || 1;
    let limit = 10;

    const orders = await adminHelper.getFullOrders(page, limit);
    const ordersCount=await adminHelper.getOrdersCount();
    const startingIndex = (page - 1) * limit + 1;
    orders.forEach((orders, index) => {
      orders.serialNumber = startingIndex + index;
    });
    const pagination = userHelper.paginate({ current: page, count: ordersCount , limit: limit, url: '/admin/order-list' });
    res.render('admin/order-list', { admin, admin_header: true, orders ,pagination});
  } catch (error) {
    next(error);
  }
},

// Change the status of order
updateOrderStatus: (req, res) => {
  try {
    let orderId = req.body.orderId;
    let currentStatus = req.body.currentStatus;
    let newStatus = req.body.newStatus;
    adminHelper.updateOrderStatus(orderId, currentStatus, newStatus).then((response) => {
      res.json({ status: true });
    });
  } catch (error) {
    next(error);
  }
},

//view order details
orderDetails:async(req,res)=>{
  try{
    let admin=req.session.admin
    let id=req.params.id;
    let orderDetails=await  userHelper.getOrderDetails(id)
    let orderProducts= await userHelper.getOrderProducts(id);
    res.render('admin/order-details',{admin, admin_header: true, orderDetails,orderProducts})
  }catch(error){
    console.log(error);
    res.render('error', { message: 'Error occurred while fetching order details' });
  }
},

//get the coupen management page
getCouponPage:async(req,res)=>{
  try{
    let coupons=await adminHelper.getCoupons()
    let admin=req.session.admin;
    res.render('admin/coupon',{admin,admin_header:true,coupons})
  }catch(error){
    console.log(error);
    res.render('error', { message: 'Error occurred while fetching coupon page' });
  }
},

//add new coupon
addCoupon:async(req,res)=>{
  try{
    adminHelper.addCoupon(req.body).then((response)=>{
      res.status(200).json({ status: true });
    })
  }catch(error){
    console.log(error);
    res.status(500).json({status:false,message: 'Failed to add coupon' }) 
  }
},

//get return request page
getReturnRequest: async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 10;
    console.log('pagee',page);
    const admin = req.session.admin;
    const returnRequests = await adminHelper.getReturnProduct(page,limit);
    const startingIndex = (page - 1) * limit + 1;
    returnRequests.forEach((returnRequests, index) => {
      returnRequests.serialNumber = startingIndex + index;
    });
    const totalReturnCount= await adminHelper.getTotalReturnCount();
    const pagination = userHelper.paginate({ current: page, count: totalReturnCount , limit: limit, url: '/admin/return-request' });
    res.render('admin/return-request', { admin, returnRequests ,admin_header:true,pagination});
  } catch (error) {
    console.log(error);
    // handle error
    res.render('error', { message: 'Error occurred while fetching return request page' });
  }
},

//retrun approval
returnApproval: async (req, res) => {
  try {
    const { returnId, userId, orderId, totalAmount } = req.body;
    let amountToWallet = await adminHelper.retrunAmountToWallet(
      userId,
      totalAmount
    );
    let orderStatus = await adminHelper.changeOrderStatusOfReturn(orderId);
    if (amountToWallet && orderStatus) {
      await adminHelper.changeReturnStatus(returnId, true);
      res
        .status(200)
        .json({ status: true, amountToWallet, orderStatus, isApproved: true });
    } else {
      res
        .status(500)
        .json({ status: false, message: "Error occured while return approval" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Failed to approve return" });
  }
},


//get sales report
getSalesReport: async (req, res) => {
  try {
    let admin = req.session.admin;

    // get start and end dates from query params or set default values
    let startDate = req.query.startDate ? new Date(req.query.startDate) : new Date("2000-01-01");
    let endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // get sales report data
    let sales = await dashboardHelper.getSalesReport(startDate, endDate);

    res.render("admin/sales-report", {
      admin,
      admin_header: true,
      sales,
      startDate: startDate.toISOString().slice(0, 10), // format date for input field
      endDate: endDate.toISOString().slice(0, 10) // format date for input field
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Failed to get sales report" });
  }
},


//sales report download format
salesReportDownload :async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const sales = await dashboardHelper.getSalesReport(startDate, endDate);
    const csvWriter = createCsvWriter({
      path: 'sales-report.csv',
      header: [
        {id: 'title', title: ''},
        {id: 'value', title: 'Sales Report'}
      ]
    });

    const data = [
      {title: 'Total Orders', value: sales.totalOrders},
      {title: 'Total Products Sold', value: sales.totalProductsSold},
      {title: 'Total Revenue', value: sales.totalRevenue},
      {title: 'Total Profit', value: sales.totalProfit}
    ];

    await csvWriter.writeRecords(data);

    res.download('sales-report.csv');
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
}



}