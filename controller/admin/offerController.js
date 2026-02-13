const offerSchema = require('../../model/offerModel')
const productSchema = require('../../model/productModel')

const categorySchema = require('../../model/categoryModel')
const loadOffer = async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 5
  const skip = (page - 1) * limit;

  try {
    const totalOffer = await offerSchema.countDocuments()

    const [offers, products, categories] = await Promise.all([
      offerSchema.find().populate("selectedProducts").populate("selectedCategory").populate("target").skip(skip).limit(limit),
      productSchema.find(),
      categorySchema.find(),
    ]);
    const totalPages = Math.ceil(totalOffer / limit);


    res.render("admin/offer", {
      offers, categories, products,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error("Error loading offers:", error);
    res.status(500).send("Internal Server Error");
  }
};



const addOffer = async (req, res) => {
  console.log('keyr');
  try {
    const {
      title,
      discountAmount,
      minimumPrice,
      startDate,
      endDate,
      targetType,
      selectedItems,
    } = req.body; 

    console.log(req.body);

    if (discountAmount < 0) {
      return res.status(400).json({ message: 'Discount amount cannot be negative' });
    }
    if (minimumPrice < 50) {
      return res.status(400).json({ message: 'Minimum Price cannot be less than 50' });
    }
 
    const existingOffer = await offerSchema.findOne({ title });

    if (existingOffer) {
      return res.status(409).json({
        message: "Offer with this name already exists.",
      });
    }

    const newOffer = new offerSchema({
      title,
      discountAmount,
      minimumPrice,
      startDate,
      endDate,  
      targetType,
    });


    if (Array.isArray(selectedItems)) {
      for (const item of selectedItems) {
        if (item && (typeof item === 'string' || item instanceof Object)) {
          if (targetType === "Product") {
            const product = await productSchema.findById(item); 
            if (!product) {
              return res.status(400).json({ message: `Product with ID ${item} does not exist.` });
            }

            const productPrice = product.price;
            if (discountAmount > productPrice / 2) {
              return res.status(400).json({
                message: `Offer not applicable: Discount amount cannot be greater than half the price of product (${productPrice}) for product ${product.productName}.`,
              });
            }

            newOffer.selectedProducts.push(item);
          } else if (targetType === "Category") {
            newOffer.selectedCategory.push(item);
          }
        } else {
          console.error('Invalid item in selectedItems:', item);
        }
      }
    }
 

    console.log('newOffer : ', newOffer);


    const savedOffer = await newOffer.save();
    return res.status(201).json(savedOffer);
  } catch (error) {
    console.error('Error from add offer : ', error)
    return res.status(500).json({ message: "Failed to create offer", error });
  }
};


const editOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const {
      title,
      discountAmount,
      minimumPrice,
      startDate,
      endDate,
      targetType,
      selectedItems,
    } = req.body;

    if (discountAmount !== undefined) {
      if (discountAmount < 0) {
        return res.status(400).json({ message: 'Discount amount cannot be negative' });
      }
 
    }
  
    const offer = await offerSchema.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (title !== undefined) offer.title = title;
    if (discountAmount !== undefined) offer.discountAmount = discountAmount;
    if (minimumPrice !== undefined) offer.minimumPrice = minimumPrice;

    if (startDate !== undefined) offer.startDate = startDate;
    if (endDate !== undefined) offer.endDate = endDate;
    if (targetType !== undefined) offer.targetType = targetType;

    if (Array.isArray(selectedItems)) {
      if (targetType === 'Product') {
        offer.selectedProducts = selectedItems;
        offer.selectedCategory = [];
      } else if (targetType === 'Category') {
        offer.selectedCategory = selectedItems;
        offer.selectedProducts = [];
      }
    }

    

    const updatedOffer = await offer.save();

    return res.status(200).json(updatedOffer);
  } catch (error) {
    console.error('Error updating offer:', error);
    return res.status(500).json({ message: 'Failed to update offer', error });
  }
};

const offerStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'Invalid value for isActive' });
    }

    const offer = await offerSchema.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    offer.isActive = isActive;
    const updatedOffer = await offer.save();

    res.status(200).json({
      message: `Offer ${isActive ? 'activated' : 'deactivated'} successfully`,
      offer: updatedOffer,
    });
  } catch (error) {
    console.error('Error toggling offer status:', error);
    res.status(500).json({ message: 'Failed to update offer status', error });
  }
};



module.exports = {
  loadOffer, addOffer, editOffer, offerStatus
}