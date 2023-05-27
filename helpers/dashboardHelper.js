const db = require("../config/connections");
const collection = require("../config/collections");
const { ObjectId } = require("mongodb");
const async = require("hbs/lib/async");
const moment = require('moment');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


module.exports = {

  //get total revenue
  getMonthlyTotalRevenue:async()=>{
    try{
      const totalRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $addFields: {
            orderDate: {
              $dateFromString: {
                dateString: "$orderDate",
                format: "%d/%m/%Y"
              }
            }
          }
        },
        {
          $match: {
            status: {
              $in: ["placed", "confirmed", "delivered"]
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$orderDate" },
              month: { $month: "$orderDate" }
            },
            totalRevenue: {
              $sum: "$totalPrice"
            }
          }
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1
          }
        }
      ]).toArray();
      console.log("Total revenue",totalRevenue);
      return totalRevenue[0].totalRevenue
    }catch(error){
      console.log(error);
      resolve.render("error")
    }

  },

  //get pending orders to deliver
  getPendingOrders: async () => {
    try {
      const pendingOrdersCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
        status: {
          $in: ["confirmed", "placed"]
        }
      });
      console.log('count',pendingOrdersCount);
      return pendingOrdersCount;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  //get total product count
  getTotalProductCount:async()=>{
    try{
      const productCount=await db.get().collection(collection.PRODUCT_COLLECTION).countDocuments();
      return productCount
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //get category wise sales
  getCategoryWiseSales: async () => {
    try {
      const categoryWiseSales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "products.item",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        {
          $unwind: "$productDetails"
        },
        {
          $group: {
            _id: "$productDetails.category_name",
            totalSales: { $sum: "$totalPrice" }
          }
        }
      ]).toArray();
      console.log('category wise sales',categoryWiseSales);
      return categoryWiseSales
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  //get sales by payment method used
  getPaymentMethodSales:async()=>{
    try{
      const paymentMethodSales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $group: {
            _id: '$paymentMethod',
            totalSales: { $sum: '$totalPrice' }
          }
        }
      ]).toArray()
      console.log('payment method',paymentMethodSales);
      return paymentMethodSales;
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //get weekly sales 
  getWeeklySales: async () => {
    try {
      let weeklySales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            createdAt: {
              $gte: moment().subtract(1, 'month').startOf('month').toDate(),
              $lte: moment().endOf('month').toDate()
            }
          }
        },
        {
          $project: {
            week: { $week: "$createdAt" },
            totalPrice: 1
          }
        },
        {
          $group: {
            _id:  "$week",
            totalSales: { $sum: "$totalPrice" }
          }
        },
        {
          $sort: {
            "_id.week": 1
          }
        }
      ]).toArray();
      console.log('weekly sales', weeklySales);
      return weeklySales;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  //get sales report on daily basis
  getSalesReport: async (startDate, endDate) => {
    console.log('staaart date',startDate);
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    }
    console.log('startdate',startDate);
  
    // If no start and end date are provided, set to null to retrieve all data
    if (!startDate && !endDate) {
      start = null;
      end = null;
    }
  
    let deliveredOrders = await db.get().collection(collection.ORDER_COLLECTION)
      .find({status: "delivered", createdAt: {$gte: start, $lt: end}})
      .toArray();
    
    let totalOrders = deliveredOrders.length;
    let totalProductsSold = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    console.log('orders',totalOrders);
    deliveredOrders.forEach((order) => {
      totalProductsSold += order.products.length;
      totalRevenue += order.totalPrice;
      totalProfit += order.totalPrice * 0.22; // assuming 22% profit margin
    });
    console.log('togtal order',totalProductsSold);
    return {
      totalOrders,
      totalProductsSold,
      totalRevenue,
      totalProfit
    };
  },




  
}