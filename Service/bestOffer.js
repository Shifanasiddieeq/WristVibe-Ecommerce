
const Offer = require('../model/offerModel');
const Product = require('../model/productModel');
const Category=require('../model/categoryModel')

const findBestOffer = (product, offers) => {
 

    let bestOffer = null;
    const currentDate = new Date();

    const productOffers = offers.filter((offer) =>
        offer.targetType === "Product" &&
        offer.selectedProducts.some((p) => p.equals(product._id)) &&
        product.price >= offer.minimumPrice &&
        offer.isActive &&
        currentDate >= offer.startDate &&
        currentDate <= offer.endDate
    ); 


    const categoryOffers = offers.filter((offer) =>
        offer.targetType === "Category" &&
        offer.selectedCategory.some((c) => c.equals(product.category)) &&
        product.price >= offer.minimumPrice &&
        offer.isActive &&
        currentDate >= offer.startDate &&
        currentDate <= offer.endDate
    );
  


    const allOffers = [...productOffers, ...categoryOffers];


    if (allOffers.length > 0) {
        bestOffer = allOffers.reduce((best, current) => {
            const currentDiscountedPrice = product.price - current.discountAmount;
            const bestDiscountedPrice = product.price - (best ? best.discountAmount : 0);

            if (currentDiscountedPrice < current.minimumPrice || currentDiscountedPrice < 0) {
                return best;

            }
            return current.discountAmount > (best ? best.discountAmount : 0) ? current : best;
        },
            null);
    }
 

    return bestOffer;
};


module.exports = {
    findBestOffer
};
