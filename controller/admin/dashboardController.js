const Order = require('../../model/orderModel');
const Product = require('../../model/productModel');
const Category = require('../../model/categoryModel');
const moment=require('moment')


const filter = async (req, res) => {
  const { period } = req.body;
  
  
  try {
    if (!['weekly', 'monthly', 'yearly'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period specified' });
    }
    
    const salesData = await getSalesAndRevenue(period);
    res.json({ salesData });
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  
    
  }
};


async function getFilteredData (value) {
  const orders = await Order.find()

  if(value === 'yearly'){
      return orders.reduce((ac, item) => {
          const year = moment(item.orderDate).year()
          ac[year] = (ac[year] || 0) + item.totalPrice
          return ac
      }, {})
  }else if(value === 'monthly'){
      return orders.reduce((ac, item) => {
          const month = moment(item.orderDate).format('YYYY-MM')
          ac[month] = (ac[month] || 0) + item.totalPrice
          return ac
      }, {})
  }else if(value === 'weekly'){
      return orders.reduce((acc, item) => {
          const date = new Date(item.orderDate)
          const week = `Year ${date.getFullYear()} - Week ${moment(date).isoWeek()}`
          acc[week] = (acc[week] || 0) + item.totalPrice
          return acc
      }, {});
  }
  
}


const changeFilter= async(req,res)=>{
  const {dates}=req.body
  
  const changes = await  getFilteredData(dates)
  res.status(200).json({changes})
  


}



const loadDashboard = async (req, res) => {
  try {
    const salesData = await getFilteredData('yearly');

    const orders=await Order.find()


    let productSold = 0
    const bestSellingProduct = {}
    orders.forEach(item => {
        productSold += item.products.reduce((sum,item) => sum + item.quantity,0)

        item.products.forEach(product => {
            const productName = product.productName
            bestSellingProduct[productName] = (bestSellingProduct[productName] || 0) + product.quantity
        })

    })
    const topSellingProduct = Object.entries(bestSellingProduct).sort(([,quantity1],[,quantity2]) => quantity2 - quantity1).slice(0,10)
   
    const bestProducts = topSellingProduct.map(([productName,quantity]) => ({productName,quantity}))



    const populatedOrders = await Order.find().populate('products.productId')
    
    const sellingcategory = {}
    const sellingBrand = {}

    for (const order of populatedOrders) {
      for (const item of order.products) {
          const categoryname = await Category.findById(item.productId.category);
          const categoryName = categoryname.name;
          const brandName = item.productId.brand;
          
          sellingcategory[categoryName] = (sellingcategory[categoryName] || 0) + 1;
          sellingBrand[brandName] = (sellingBrand[brandName] || 0) + 1;
      }
  }

    const topSelligCategory = Object.entries(sellingcategory).sort(([,quantity1],[,quantity2]) => quantity2 - quantity1).slice(0,10)
    const bestSellingCategory = topSelligCategory.map(([categoryName,quantity]) => ({categoryName,quantity})) 
    const topSellingBrand = Object.entries(sellingBrand).sort(([,quantity1],[,quantity2]) => quantity2 - quantity1).slice(0,10)
    const bestSellingBrand = topSellingBrand.map(([brandName,quantity]) => ({brandName,quantity}))

    console.log(topSellingBrand,'gg');


    res.render('admin/dashboard', {
      salesData:JSON.stringify(salesData),
      bestSellingCategory ,bestSellingBrand ,
      bestProducts


    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Internal Server Error"); 
  }
};



const getTopSellingProducts = async () => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$products" },
      { $group: {
        _id: "$products.productId",
        totalQuantity: { $sum: "$products.quantity" },
        productName: { $first: "$products.productName" },
      }},
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    return topProducts;
  } catch (error) {
    console.error("Error fetching top-selling products:", error);
    return [];
  }
};

const getTopSellingCategories = async () => {
  try {
    const topCategories = await Order.aggregate([
      { $unwind: "$products" },
      { $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $group: {
        _id: "$product.category",
        totalQuantity: { $sum: "$products.quantity" },
      }},
      { $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $project: { categoryName: "$category.name", totalQuantity: 1 }},
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    return topCategories;
  } catch (error) {
    console.error("Error fetching top-selling categories:", error);
    return [];
  }
};


module.exports = {
  
  getTopSellingProducts,
  getTopSellingCategories,
  loadDashboard, 
  getFilteredData,
  changeFilter,
  filter
};
