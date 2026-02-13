const Product = require('../../model/productModel')
const Offer = require('../../model/offerModel')
const categorySchema = require('../../model/categoryModel');
const { findBestOffer } = require('../../Service/bestOffer')


const loadShop = async (req, res) => {
    const { category, sort, search, page = 1, limit = 10 } = req.query; 

    const categorySelected = category || '';
    const sortBy = sort || '';
    const searchQuery = search || '';

    const filterConditions = {};

    if (categorySelected && categorySelected !== 'all') {
        filterConditions.category = categorySelected;
    }

    if (searchQuery) {
        filterConditions.productName = { $regex: searchQuery, $options: 'i' };
    }

    let sortConditions = {};
    switch (sortBy) {
        case 'price_asc':
            sortConditions = { price: 1 };
            break;
        case 'price_desc':
            sortConditions = { price: -1 };
            break;
        case 'a_z':
            sortConditions = { productName: 1 };
            break;
        case 'z_a':
            sortConditions = { productName: -1 };
            break;
        default:
            sortConditions = {};
            break;
    }

    try {
        const categories = await categorySchema.find({ isListed: true });

        const totalProducts = await Product.countDocuments({ isListed: true, ...filterConditions }); 
        const totalPages = Math.ceil(totalProducts / limit);

        const productss = await Product.find({ isListed: true, ...filterConditions })
            .sort(sortConditions)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('category');

        const products = productss.filter(item => item.category.isListed === true);

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

        res.render('user/shop', {
            categories,
            products: productsWithOffers,
            categorySelected,
            sortBy,
            searchQuery,
            currentPage: parseInt(page),
            totalPages,
        });
    } catch (error) {
        console.error('Error loading shop:', error);
        res.status(500).send('Server Error');
    }
};




const productDetails = async (req, res) => {
    try {
        
        const product = await Product.findOne({
            _id: req.params.id,
            isListed: true,
        }).populate('category'); 

        
        if (!product) {
            return res.status(404).send('Product not found or unlisted');
        }
  
        
        const relatedProduct = await Product.find({
            isListed: true,
            category: product.category,
            _id: { $ne: req.params.id },
        });

       
        const offers = await Offer.find({ isActive: true })
            .populate('selectedProducts')
            .populate('selectedCategory');

       
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

       
        const priceWithOffer = bestOffer
            ? Math.max(0, product.price - bestOffer.discountAmount) 
            : product.price;

        const categoryName = product.category.name
            
            
        res.render('user/productDetails', {
            product: {
                ...product.toObject(),
                bestOffer,
                priceWithOffer,
            },
            relatedProduct,
            categoryName
        });
    } catch (err) {
        console.error('Error loading product details:', err);
        res.status(500).send('Server Error');
    }
};


module.exports = {
    loadShop, productDetails, findBestOffer
}

