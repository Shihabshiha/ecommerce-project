const adminHelper=require('../helpers/adminHelpers')
const userHelper=require('../helpers/userHelpers')
const productHelper=require('../helpers/productHelpers')

module.exports={
  // Display all products on shop page
  shopPage: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 9;
      const category = await adminHelper.getAllCategory();
      let cartCount = 0; 
      let user = null;
      if (req.session.user) {
        user = req.session.user;
        cartCount = await userHelper.getCartCount(user._id); 
      }
  
      const product = await productHelper.shopProducts(page, limit);
      const totalProducts = await productHelper.getTotalProductsCount();
      console.log('pro count',totalProducts);
      const pagination = userHelper.paginate({
        current: page,
        count: totalProducts,
        limit: limit,
        url: '/shop-page',
      });
      console.log('userrrr',user);
      res.render('user/shop-page', { user, product, category, cartCount, pagination });
    } catch (error) {
      console.log(error);
      res.render('error', { message: error.message });
    }
  },
  
  


  // Display product details page for a specific product
  productDetails: async (req, res) => {
    try {
      let id = req.params.id;
      let cartCount = 0; 
      let user;
  
      if (req.session.user) {
        const user = req.session.user;
        cartCount = await userHelper.getCartCount(user._id); 
      }

      const proDetails = await productHelper.productDetail(id);
    
      res.render('user/product-details', { user, proDetails,cartCount })
    } catch (error) {
      console.log(error);
      res.render('error', { message: error.message });
    }
  },

  //category wise items page
  CategoryFilterPage:async (req,res)=>{
    try {
      let categoryId=req.params.id; 
      let cartCount = 0; 
      let user;
      const page = parseInt(req.query.page) || 1;
      const limit = 9;
  
      if (req.session.user) {
        const user = req.session.user;
        cartCount = await userHelper.getCartCount(user._id); 
      }

      let category= await adminHelper.getAllCategory()
      const product= await productHelper.categoryWiseFilter(categoryId,page,limit);
      const productCount=await productHelper.getCategoryItemCount(categoryId)
      console.log('cat count',productCount);
      const pagination = userHelper.paginate({
        current: page,
        count: productCount,
        limit: limit,
        url: '/category-filter',
      });
      res.render('user/category-filter',{user,product,category,cartCount,pagination})
    }catch (error){
      console.log(error);
    }
  },
  
  //search products
  searchProducts: async (req, res) => {
    try {
      
      const page = parseInt(req.query.page) || 1;
      const limit = 9;
      const category= await adminHelper.getAllCategory();
      
      let cartCount = 0; 
      let user;
  
      if (req.session.user) {
        const user = req.session.user;
        cartCount = await userHelper.getCartCount(user._id); 
      }


      const searchQuery = req.query.q;
      console.log('searchedddd',searchQuery);
      const product = await productHelper.searchedProducts(page, limit, searchQuery);

      let notFound;
      if(product.length==0){
        notFound='Product not found..!Search another'
      }
      const totalProducts = await productHelper.getTotalProductsCount();
      const pagination = userHelper.paginate({ current: page, count: totalProducts, limit: limit, url: '/shop-page' });

      res.render('user/shop-page', { user, product, category, cartCount, pagination ,notFound});

    } catch (error) {
      console.log(error);
      res.render('error', { message: error.message });
    }
  }
  
  
  
}