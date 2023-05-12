const db = require("../config/connections");
const collection = require("../config/collections");
const { ObjectId } = require("mongodb");
const async = require("hbs/lib/async");

module.exports={

  // Loading products in user side
  shopProducts: (page, limit) => {
    return new Promise(async (resolve, reject) => {
      try {
        const startingIndex = (page - 1) * limit;
        let product = await db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .find({})
          .sort({ createdAt: -1 })
          .skip(startingIndex)
          .limit(limit)
          .toArray();

        resolve(product)
      } catch (err) {
        reject(err);
      }
    });
  },

  //loading a specific category page 
  productDetail: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let proDetails = await db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({_id: ObjectId(id)});
        resolve(proDetails);
      } catch (err) {
        reject(err);
      }
    });
  }
  ,

  //ctaegory wise filter the produts
  categoryWiseFilter: async (id) => {
    try {
      const products = await db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .aggregate([
        {
          $lookup: {
            from: "category",
            localField: "category_name",
            foreignField: "category_name",
            as: "category"
          }
        },
        {
          $match: {
            "category._id": ObjectId(id)
          }
        }
      ]).toArray();
      console.log(products);
      return products;
    } catch (error) {
      console.log(error);
    }
  },

  //get total product count
  getTotalProductsCount:async()=>{
    try{
      let count=await db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .countDocuments()
      return count
    }catch(error){
      console.log(error);
      throw error
    }
  },

  //serached products loading on user side
  searchedProducts: (page, limit, searchQuery) => {
    return new Promise(async (resolve, reject) => {
      try {
        const startingIndex = (page - 1) * limit;
        let product = await db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .find(searchQuery ? { product_name: { $regex: new RegExp(searchQuery, 'i') } } : {})
          .sort({ createdAt: -1 })
          .skip(startingIndex)
          .limit(limit)
          .toArray();
        resolve(product);
      } catch (err) {
        reject(err);
      }
    });
  }
  

  
}