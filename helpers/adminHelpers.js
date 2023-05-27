const db = require("../config/connections");
const collection = require("../config/collections");
const { ObjectId } = require("mongodb");
const async = require("hbs/lib/async");
const userHelpers = require("./userHelpers");

module.exports = {
  //admin authentication check

  adminLogin: function (adminData) {
    return new Promise(async function (resolve, reject) {
      try {
        let admin = await db
          .get()
          .collection(collection.ADMIN_COLLECTION)
          .findOne({ email: adminData.email });
        if (admin && adminData.password === admin.password) {
          console.log("admin login success");
          resolve(admin);
        } else {
          console.log("admin login failed");
          reject({ err: true });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  //Getting all user details
  userDetails: function (page,limit) {
    return new Promise(async function (resolve, reject) {
      try {
        const startingIndex = (page - 1) * limit;
        let userDetails = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .find({})
          .skip(startingIndex)
          .limit(limit)
          .toArray();
        resolve(userDetails);
      } catch (error) {
        reject(error);
      }
    });
  },

  //get users count
  getAllUsersCount:async()=>{
    try{
      let count=db.get()
      .collection(collection.USER_COLLECTION)
      .countDocuments()
      return count;
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //User block by admin

  userBlock: function (id) {
    return new Promise(async function (resolve, reject) {
      try {
        let status = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne({ _id: ObjectId(id) }, { $set: { access: false } });
        resolve(status);
      } catch (error) {
        reject(error);
      }
    });
  },

  //user unblock by admin

  userUnblock: function (id) {
    return new Promise(async function (resolve, reject) {
      try {
        let status = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne({ _id: ObjectId(id) }, { $set: { access: true } });
        resolve(status);
      } catch (error) {
        reject(error);
      }
    });
  },

  //get all products
  getAllProducts: (page, limit) => {
    return new Promise(async (resolve, reject) => {
      try {
        const startingIndex = (page - 1) * limit;
        let products = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .find()
          .sort({ createdAt: -1 })
          .skip(startingIndex)
          .limit(limit)
          .toArray();
          resolve(products);
      } catch (err) {
        reject(err);
      }
    });
  },

  //Add products

  addProducts: (product,files) => {
    return new Promise(async (resolve, reject) => {
      try {
        let obj = {
          product_name: product.product_name,
          product_description: product.product_description,
          price: parseFloat(product.price),
          category_name: product.category_name,
          createdAt: new Date(),
          images:{}
        };


        for(let i=0;i<files.length;i++){
          obj.images[`image${i+1}`] =files[i].path;
        }
        let productData = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .insertOne(obj);
        resolve(productData);
      } catch (error) {
        reject(error);
      }
    });
  },



  //get all category and show to admin
  getAllCategory: async() => {
      try {
        let category = await db
          .get()
          .collection(collection.CATEGORY_COLLECTION)
          .find({})
          .toArray();
        return category
      } catch (error) {
        return error
      }
  },

  //add category
  addCategory: async (categoryData) => {
    try {
      let category = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ category_name: categoryData });
      if (category) {
        throw { message: "Category already exists" };
      } else {
        const obj ={
          category_name: categoryData
        }
        await db
          .get()
          .collection(collection.CATEGORY_COLLECTION)
          .insertOne(obj);
        return;
      }
    } catch (err) {
      throw err;
    }
  },

  //delete category
  deleteCategory: (id) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .deleteOne({ _id: ObjectId(id) });
      resolve();
    });
  },

  //Edit product
  editProduct: (id) => {
    return new Promise(async (resolve, reject) => {
      let productInfo = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(id) });
      resolve(productInfo);
    });
  },

  //Edited product updating
  productUpdate: async (id, obj)=> {
   
      try {
      await db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne({ _id: ObjectId(id) }, { $set: obj });
        return true
      } catch (error) {
       return error
      }
    
  },

  
  //delete product
  deleteProduct: function (id) {
    return new Promise(async function (resolve, reject) {
      try {
        let delproduct = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .deleteOne({ _id: ObjectId(id) });
        resolve(delproduct);
      } catch (error) {
        reject(error);
      }
    });
  },

  //get all orders of users
  getFullOrders: async (page,limit) => {
    try {
      const startingIndex = (page - 1) * limit;
      const orders = await db.get()
      .collection(collection.ORDER_COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .skip(startingIndex)
      .limit(limit)
      .toArray();
      return orders;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  //get orders count
  getOrdersCount:async()=>{
    try{
      let count= db.get()
      .collection(collection.ORDER_COLLECTION)
      .countDocuments()
      return count
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //update the order status
  updateOrderStatus: (orderId, currentStatus, newStatus) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId), status: currentStatus },
          {
            $set: { status: newStatus },
          }
        )
        .then((response) => {
          if (response.modifiedCount > 0) {
            resolve({ status: true });
          } else {
            resolve({ status: false });
          }
        });
    });
  },

  //add new coupon
  addCoupon:async(couponData)=>{
    try{
      let coupon=await db.get()
      .collection(collection.COUPON_COLLECTION)
      .insertOne(couponData)
      return coupon
    }catch(error){
      console.log(error);
      throw error;
    }
  },

  //get coupons already added
  getCoupons:async()=>{
    try{
      let coupons= await db.get()
      .collection(collection.COUPON_COLLECTION)
      .find({})
      .toArray()
      return coupons
    }catch(error){
      console.log(error)
      throw error
    }
  },

  //delete coupon
  deleteCoupon:async(couponId)=>{
    try{
      let result=db.get()
      .collection(collection.COUPON_COLLECTION)
      .deleteOne({ _id: ObjectId(couponId) })
      return result
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //get returns from users
  getReturns:async()=>{
    try{
      let returns=db.get()
      .collection(collection.RETURN_COLLECTION)
      .find({})
      .toArray()
      return returns
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //get return product details
  getReturnProduct: async (page,limit) => {
    try {
      const returns = await db.get()
      .collection(collection.RETURN_COLLECTION)
      .find({})
      .sort({ returnedDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
      const productIds = returns.map((returnRequest) => returnRequest.productId);

      const products = await db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .find({ _id: { $in: productIds.map(pId => ObjectId(pId)) } })
      .toArray();
      console.log("Products:", products);
      const productMap = products.reduce((acc, product) => {
        acc[product._id.toString()] = product;
        return acc;
      }, {});
       
      const returnProductDetails = returns.map((returnRequest) => {
        const productId = returnRequest.productId;
        const product = productMap[productId.toString()];
        return { ...returnRequest, product };
      });
      console.log("Return Product Details:", returnProductDetails);
      return returnProductDetails;

    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  //get total return request count
  getTotalReturnCount:async()=>{
    try{
      let count=await db.get()
      .collection(collection.RETURN_COLLECTION)
      .countDocuments();
      return count
    }catch(error){
      console.log(error);
      throw error
    }
  },
  
  //return amount to wallet of user
  retrunAmountToWallet:async(userId,totalAmount)=>{
    try{
      let totalAmountInt = parseInt(totalAmount);
      let wallet=await db.get()
      .collection(collection.WALLET_COLLECTION)
      .findOne({userId:ObjectId(userId)});

      if(!wallet){
        await userHelpers.createWalletForUser(userId);
      }

      let transaction={
        type:'Returned',
        discription:'Paided amount',
        amount: totalAmountInt,
        date:new Date()
      }
      let newBalance;
      if (wallet.balance) {
        newBalance = parseInt(wallet.balance) + totalAmountInt;
      } else {
        newBalance = totalAmountInt;
      }

      console.log('new balnace',newBalance);
      await db.get()
      .collection(collection.WALLET_COLLECTION)
      .updateOne({ userId: ObjectId(userId) },
       {
         $set: { balance: newBalance } ,
         $push: { transactions: transaction }
       });
      return totalAmountInt
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //change the status of returned order
  changeOrderStatusOfReturn:async(orderId)=>{
    try{
      let newStatus= await db.get().collection(collection.ORDER_COLLECTION).updateOne({orderId:orderId},
        {
          $set:{status:'returned'}
        }
        )
        return newStatus
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //change the return status
  changeReturnStatus: async (returnId, isApproved) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await db
          .get()
          .collection(collection.RETURN_COLLECTION)
          .updateOne(
            { _id: ObjectId(returnId) },
            { $set: { isApproved: isApproved } }
          );
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  
  
  
  
};
