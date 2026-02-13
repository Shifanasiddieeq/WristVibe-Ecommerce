const User = require('../../model/userModel')

const Product = require('../../model/productModel')
const { findBestOffer } = require('../../Service/bestOffer')
const Offer = require('../../model/offerModel')
const categorySchema = require('../../model/categoryModel');


const loadHome = async (req, res) => {
    try {
       
        const productss = await Product.find({ isListed: true }).populate('category');
        const products = productss.filter(item => item.category.isListed === true)
        

        const offers = await Offer.find({ isActive: true })
            .populate('selectedProducts')
            .populate('selectedCategory');

 
        const productsWithOffers = products.map((product) => {
            const findBestOffer = (product, offers) => {
                const productOffers = offers.filter(offer =>
                    offer.selectedProducts.some(p => p.equals(product._id)) || 
                    offer.selectedCategory.some(c => c.equals(product.category._id))
                );

                if (productOffers.length > 0) {
                    return productOffers.reduce((best, offer) =>
                        offer.discountAmount > best.discountAmount ? offer : best,
                        productOffers[0]
                    );
                }
                return null;
            };

            const bestOffer = findBestOffer(product, offers);

            return {
                ...product.toObject(),
                bestOffer,
            };
        });

     
        res.render('user/home', {
            products: productsWithOffers,
        });
    } catch (error) {
        console.error('Error loading home:', error);
        res.status(500).send('Server Error');
    }
};


const loadAbout = async(req,res)=>{
    res.render('user/aboutus')
}

const loadContact = async(req,res)=>{
    res.render('user/contactus')
}

module.exports = {
    loadHome,loadAbout,loadContact
}