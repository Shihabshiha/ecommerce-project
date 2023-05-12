var db = require("../config/connections");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { response } = require("express");
const Razorpay = require('razorpay');
const { log } = require("console");
const async = require("hbs/lib/async");

var instance = new Razorpay({
  key_id: 'rzp_test_sNyg6FiQEq6NSc',
  key_secret: 'nOdi4DQbkupluDbHNNwyDiya',
});

module.exports = {
  doSignup: (userData) => {
   
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        reject({ exists: true });
      } else {
        userData.password = await bcrypt.hash(userData.password, 10);
        var obj={
          name:userData.name,
          email:userData.email,
          phone_no:userData.phone_no,
          password:userData.password,
          access:true
        }
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(obj)
          .then((data) => {
           resolve(data);
          });
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, rejectj) => {
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
       
        if (user) {
          if(user.access===true){
            bcrypt.compare(userData.password, user.password).then((status) => {
                if (status) {
                  console.log("login success");
                  response.user = user;
                  response.status = true;
                  resolve(response);
                } else {
                  console.log("login failed");
                  resolve({ status: false });
                }
              });
          }else{
            resolve({access:false});
            console.log('admin bloked user');
          }
        } else {
          console.log("login failed 2");
          resolve({ status: false });
        }
    });
  },
  
  //check wallet exist for user
  checkIfUserHasWallet: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const wallet = await db.get()
        .collection(collection.WALLET_COLLECTION)
        .findOne({ userId: ObjectId(userId) });
        const walletExists =wallet;
        resolve(walletExists);
      } catch (error) {
        reject(error);
      }
    });
  },

  //create a wallet for user
  createWalletForUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let wallet = {
          userId: ObjectId(userId),
          balance: 0,
          transactions:[]
        };
        await db.get().collection(collection.WALLET_COLLECTION).insertOne(wallet);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  
  

  //otp login phone number matching
  otpLogin:(userPhone)=>{
    return new Promise(async(resolve,reject)=>{
      let userMob =await db.get().collection(collection.USER_COLLECTION).findOne({phone_no:userPhone})
      if(userMob) resolve({status : true});
      else reject({status : false})
    })
  },

  addToUserCart:(userId,productId)=>{
    let product={
      item:ObjectId(productId),
      quantity:1
    }
    return new Promise(async(resolve,reject)=>{
      //check the user has already a cart
      let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({userId:ObjectId(userId)})

      if(userCart){
        //check the the product us exist in the cart
        let isProductExist=userCart?.products.findIndex((product)=>{
          return product.item == productId
        });
        //if product exists we just increment the quantity
        if(isProductExist != -1){
          db.get().collection(collection.CART_COLLECTION)
          .updateOne(
            {
              userId:ObjectId(userId),
              "products.item":ObjectId(productId)
            },
            {
              $inc: {"products.$.quantity": 1},
            }
          ).then(()=>{
            resolve({status:true})
          });
        }else{
          //add the product into the already existed cart
          db.get().collection(collection.CART_COLLECTION)
          .updateOne(
            {userId:ObjectId(userId)},
            {
              $push:{products : product}
            }
          ).then((response)=>{
            resolve({status : true})
          })
        }
      }else{
        //create the new cart for user
        let cartObj={
          userId:ObjectId(userId),
          products:[product]
        };
        db.get().collection(collection.CART_COLLECTION)
        .insertOne(cartObj)
        .then((response)=>{
          resolve({status:true})
        })
      }
    })
  },
  
  getCartProduct: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { userId:ObjectId(userId)  },
          },
          {
            $unwind: "$products",
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "products.item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project:{
              item: '$products.item',
              quantity: '$products.quantity',
              price: {$arrayElemAt: ['$product.price', 0]},
              product:{$arrayElemAt:['$product',0]},
              subTotal: {$multiply: ['$products.quantity', {$arrayElemAt: ['$product.price', 0]}]},
            }
          },
        ])
        .toArray();
        console.log(cartItems);
      resolve(cartItems);
    });
  },
  

  
 
 
  //change the quantity of products from cart
  changeCartQuantity: (details) => {
    return new Promise((resolve, reject) => {
      // let { cartId, productId, count, quantity } = productData;
      details.count = parseInt( details.count);
      details.quantity = parseInt( details.quantity);
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: ObjectId(details.cart) },
            {
              $pull: { products: { item:ObjectId(details.product) } },
            }
          )
          .then((response) => {
            // console.log('item removed');
            resolve({ removed: true });
          });
      } else {
        db.get().collection(collection.CART_COLLECTION)
        .updateOne(
          {
            _id:ObjectId( details.cart),
            'products.item':ObjectId( details.product)
          },
          {
            $inc: {'products.$.quantity': details.count},
          }
        ).then((response )=>{
          // console.log('incremented');
          resolve({status:true})
        });
      }
    });
  },

  //getting the count of cart items
  getCartCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let count=0;
      let cart= await db.get()
      .collection(collection.CART_COLLECTION)
      .findOne({userId:ObjectId(userId)});
      console.log(cart);
      if(cart){
        console.log('conted');
        count=cart.products.length;
      }
      resolve(count)
    })
  },

  //remove product from cart
   removeProductFromCart:(details)=>{
    return new Promise((resolve,reject)=>{
      db.get()
      .collection(collection.CART_COLLECTION)
      .updateOne(
        { _id: ObjectId(details.cart) },
        {
          $pull: { products: { item:ObjectId(details.product) } },
        }
      )
      .then((response) => {
        // console.log('item removed');
        resolve({ removed: true });
      });
    })
  },

  //get cart total amout
  getTotalAmount:(userId)=>{
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { userId:ObjectId(userId)  },
          },
          {
            $unwind: "$products",
          },
          {
            $project:{
              item:'$products.item',
              quantity:'$products.quantity'
            }
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project:{
              item:1,
              quantity:1,
              product:{$arrayElemAt:['$product',0]}
            }
          },
          {
            $group:{
              _id:null,
              total:{$sum:{$multiply:['$quantity','$product.price']}}
            }
          }
        ])
        .toArray();
        console.log(total)
      resolve(total[0]?.total);
    });
  },

  //get the subtotal
  findSubTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let subtotal = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { userId:ObjectId(userId)  },
          },
          {
            $unwind: "$products",
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "products.item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project:{             
              subTotal: {$multiply: ['$products.quantity', {$arrayElemAt: ['$product.price', 0]}]},
            }
          },
        ])
        .toArray();
        console.log(subtotal);
      resolve(subtotal);
    });
  },

  

  //add user address
  addUserAddress: async (address) => {
    try {
      const data = await db.get()
      .collection(collection.ADDRESS_COLLECTION)
      .insertOne(address);
      return data;
    } catch (error) {
      console.error(error);
      throw new Error('Unable to add address');
    }
  },
  

  //get user address
  getUserAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let address = await db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .find({ userId: userId }).toArray()       
        resolve(address)
      } catch (error) {
        reject(error)
      }
    })
  },

  //get user address to edit
  getUserAddressToEdit:async(addressId)=>{
    try{
      let address=await db.get()
      .collection(collection.ADDRESS_COLLECTION)
      .findOne({_id:ObjectId(addressId)});
      return address
    }catch(error){
      console.log(error);
    }
  },

  //update user address
  updateAddress:async(id,addressData)=>{
    try {
      const updateData = {
        billing_address:addressData.billing_address,
        billing_address2:addressData.billing_address2,
        city:addressData.city,
        state:addressData.state,
        zipcode:addressData.zipcode,
        phone:addressData.phone,
        email:addressData.email
      }
      
      const address = await db.get()
      .collection(collection.ADDRESS_COLLECTION)
      .updateOne({_id:ObjectId(id)},{ $set: updateData });
      console.log(user);
      return address;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  },

  //delete user address
  deleteAddress:async(address)=>{
    try{
      let result=await db.get()
      .collection(collection.ADDRESS_COLLECTION)
      .deleteOne({_id:ObjectId(address.addressId)})
      return result.deletedCount === 1
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //get the devilery address
  getDeliveryAddress:async(addressId)=>{
    try {
      let address=await db.get()
      .collection(collection.ADDRESS_COLLECTION)
      .find({_id : ObjectId(addressId)}).toArray()
      return address[0];
    } catch (error){
      throw new Error('Did not find address');
    }
  },

  //get cart product list
  getCartProductsList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db.get()
      .collection(collection.CART_COLLECTION)
      .findOne({userId: ObjectId(userId)});
      if (cart && cart.products && cart.products.length > 0) {
        resolve(cart.products);
      } else {
        reject('Cart is empty');
      }
    });
  }  
  ,

  //place the order
  placeOrder: (order, address, products, totalPrice, user) => {
    console.log("inside place order");
    return new Promise(async (resolve, reject) => {
      try {
        const status = order['payment-option'] === 'COD' ? 'placed' : 'pending';  
         
        const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let orderId = '';
        for (let i = 0; i < 10; i++) {
          const index = Math.floor(Math.random() * randomChars.length);
          const char = randomChars.charAt(index);
          orderId += char;
        }
  
        const now = new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "short"
        });
        
      
        const orderObj = {
          orderId: orderId,
          deliveryDetails: {
            mobile: address.phone,
            address: address.billing_address,
            city: address.city,
            state: address.state,
            zipcode: address.zipcode,
          },
          userId: ObjectId(address.userId),
          userName:user.name,
          paymentMethod: order['payment-option'],
          products: products,
          totalPrice: totalPrice,
          status: status,
          orderDate: now,
          createdAt:new Date()
        };      
        
        const response = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .insertOne(orderObj)
        await db
          .get()
          .collection(collection.CART_COLLECTION)
          .deleteOne({ userId: ObjectId(address.userId) });
          console.log(response);
        resolve(response.insertedId.toString());
      } catch (error) {
        reject(error);
      }
    });
  },
  

  
  
  //get the user orders
  getOrders: async (userId, page, limit) => {
    try {
      const startingIndex = (page - 1) * limit;
      const orders = await db.get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(startingIndex)
        .limit(limit)
        .toArray();
      return orders;
    } catch (error) {
      console.log(error);
      throw new Error('Did not find orders');
    }
  }
  ,

   paginate : ({ current, count, limit, url }) => {
    const numPages = Math.ceil(count / limit);
    const pages = [];
    let i;
  
    // Add previous page link
    let prevPage = null;
    if (current > 1) {
      prevPage = current - 1;
    }
  
    // Add page links
    for (i = 1; i <= numPages; i++) {
      const isActive = i === current;
      const page = {
        page: i,
        active: isActive,
        url: `${url}?page=${i}`,
      };
      pages.push(page);
    }
  
    // Add next page link
    let nextPage = null;
    if (current < numPages) {
      nextPage = current + 1;
    }
  
    return { pages, prevPage, nextPage };
  },

  getTotalOrders: async (userId) => {
    try {
      const count = await db.get()
        .collection(collection.ORDER_COLLECTION)
        .countDocuments({ userId: ObjectId(userId) });
      return count;
    } catch (error) {
      console.log(error);
      throw new Error('Error occurred while getting total orders');
    }
  },
  

  //generate Razorpay order
  generateRazorpay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{

      let options={
        amount: total*100,
        currency: "INR",
        receipt: ""+orderId,
      };
      instance.orders.create(options,(err,order)=>{
        if(err){
          console.log(err);
        }else{
          resolve(order)
        }
      })
        
    })
  },


  //verify the payment
  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto=require('crypto');
      let hmac= crypto.createHmac('sha256','nOdi4DQbkupluDbHNNwyDiya')
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
      hmac=hmac.digest('hex')

      if(hmac==details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }
    })
  },

  //change payment status after online payment
  changePaymentStatus:(orderId)=>{
    console.log(orderId)
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLECTION)
      .updateOne({_id:ObjectId(orderId)},
      {
        $set:{status:'placed'}
      }
      ).then(()=>{
        resolve()
      })
    })
  },


  //view order details
  getOrderDetails:async(id)=>{
    try {
      let orderDetails=await db.get()
      .collection(collection.ORDER_COLLECTION)
      .find({_id:ObjectId(id)}).toArray()
      console.log('this is order:',orderDetails);
      return orderDetails[0]
    }catch(error){
      console.log(error);
      return error
    }  
  },

  //get order products details
  getOrderProducts: async (id) => {
    try {
      const order = await db.get()
      .collection(collection.ORDER_COLLECTION)
      .findOne({_id: ObjectId(id)});
      if (!order) {
        console.log(`Order with ID ${id} not found`);
        return null;
      }
      
      const results = await db.get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate([
        {
          $match: { _id: ObjectId(id) }
        },
        {
          $unwind: "$products"
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "products.item",
            foreignField: "_id",
            as: "orderedProducts"
          }
        },
        {
          $unwind: "$orderedProducts"
        },
        {
          $project: {
            _id: "$orderedProducts._id",
            name: "$orderedProducts.product_name",
            price: "$orderedProducts.price",
            quantity: "$products.quantity",
            images: "$orderedProducts.images",
            status: 1 // Include the status field from the order collection
          }
        }
      ]).toArray();
      console.log(results);
      return results;
    } catch (error) {
      console.log("Error occurred: ", error);
      throw error;
    }
  },
  
  


  //cancel order by user
  cancelOrderByUser:async(order)=>{
    try{
      let result=await db.get()
      .collection(collection.ORDER_COLLECTION)
      .updateOne({_id:ObjectId(order.orderId)},
      {
        $set:{status:'cancelled'}
      }
      )
      return result
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //get payment method and total price of cancelled order
  getPaymentDetails:async(order)=>{
    try{
      let paymentDetails=await db.get()
      .collection(collection.ORDER_COLLECTION)
      .findOne({_id:ObjectId(order.orderId)},{paymentMethod:1,totalPrice:1})
      return paymentDetails
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //return the amount to user wallet for cancelled order
  returnToWalletOfUser:async(userId,amount)=>{
    try{
      let wallet=await db.get()
      .collection(collection.WALLET_COLLECTION)
      .findOne({userId:ObjectId(userId)});
      let transaction={
        type:'Cancelled',
        discription:'Online paid',
        amount:amount,
        date:new Date()
      }
      let newBalance = wallet.balance + amount;
      await db.get()
      .collection(collection.WALLET_COLLECTION)
      .updateOne({ userId: ObjectId(userId) },
       {
         $set: { balance: newBalance } ,
         $push: { transactions: transaction }
       });
      return newBalance
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //return item by user
  returnedItemByuser:async(productId,quantity,userId,reason,orderId,orderDate)=>{
    try{
       let returnItem={
          userId:userId,
          productId:productId,
          orderId:orderId,
          quantity:parseInt(quantity),
          reason:reason,
          orderDate:orderDate,
          returnedDate:new Date()
        }
      let returned=db.get().collection(collection.RETURN_COLLECTION).insertOne(returnItem)
      return returned
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //check the item already returned
  checkReturnItemExist: async (productId, orderId) => {
    try {
      let returnItem = await db.get().collection(collection.RETURN_COLLECTION).findOne({productId, orderId});
      console.log('already returned item',returnItem);
      if (returnItem) {
        return true; // item already returned
      } else {
        return false; // item not yet returned
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  

  //change the order status of returned
  updateOrderStatus:async(orderId)=>{
    try{
      let updatedStatus=await db.get().collection(collection.ORDER_COLLECTION).updateOne({orderId:orderId},
        {
          $set:{status:'returned'}
        }
        )
        return updatedStatus
    }catch(error){
      console.log(error);
      throw error
    }
  },


  //get the avilable coupon
  getAvailableCoupon:async()=>{
    try{
      let coupons=await db.get()
      .collection(collection.COUPON_COLLECTION)
      .find({}).toArray()
      return coupons

    }catch(error){
      console.log(error);
      throw new Error('Did not find coupons');
    }
  },

  //get the coupon details by coupon code
  getCouponDetails:async(couponCode)=>{
    try{
      let coupon=await db.get()
      .collection(collection.COUPON_COLLECTION)
      .findOne({code:couponCode});
      return coupon;
    }catch(error){
      console.log(error);
      throw new Error('Did not find coupon');
    }
  },

  //save the coupons used by a user
  pushCouponToUser:async(userId,couponCode)=>{
    try{
     let couponUsed= await db.get().collection(collection.USER_COLLECTION)
      .updateOne({_id:ObjectId(userId)},
        {
          $push:{usedCoupons :couponCode}
        }
      )
      return couponUsed
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //find the user by userId
  getUserDetails:async(userId)=>{
    try{
      let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)})
      return user
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //set the discounted price in cart if coupon applied 
  discountedPrice: async (discountedTotal, userId) => {
    try {
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({userId: ObjectId(userId)});
      if (cart) {
        let result = await db.get().collection(collection.CART_COLLECTION).updateOne(
          {userId: ObjectId(userId)},
          {$set: {discountedTotal: discountedTotal}}
        );
        return result;
      } else {
        throw new Error('Cart not found');
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  //get the discounted price for the user who applied coupon
  getDiscountedTotal:async(userId)=>{
    try{
      let cart=await db.get().collection(collection.CART_COLLECTION).find({userId:ObjectId(userId)}).toArray()
      if(cart){
        return cart[0].discountedTotal;
      }else{
        throw new Error('Cart not found');
      }
    }catch(error){
      console.log(error);
      throw error
    }
  },
  
  //get the wallet of user
  getWalletOfUser:async(userId)=>{
    try{
      let wallet=await db.get()
      .collection(collection.WALLET_COLLECTION)
      .findOne({userId:ObjectId(userId)})
      return wallet
    }catch(error){
      console.log(error);
      throw error
    }
  }
  
    
  


};
