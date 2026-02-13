const Product = require('../../model/productModel');
const Category = require('../../model/categoryModel');
const StatusCodes = require('../../utils/statusCode');
const offerModel = require('../../model/offerModel');


const loadProducts = async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    try {
        const totalProducts = await Product.countDocuments();
        const products = await Product.find().populate('category')
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalProducts / limit);

        res.render('admin/product', {
            products,
            currentPage: page,
            totalPages,
        });
    } catch (err) {
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Server Error');
    }
}


const loadAddproduct = async (req, res) => {

    try {
        const products = await Product.find({});
        const categories = await Category.find({ isListed: true });
        res.render('admin/addproduct', { products, categories });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Internal Server Error');
    }

};


const addProduct = async (req, res) => {

    try {
        const { productName, brand, price, color, category, stockCount, description } = req.body;

        const imagePath = req.files.map(file => `/uploads/${file.filename}`) || [];

        if (!productName || !brand || !price || !color || !category || !stockCount || !description || imagePath.length === 0) {

            return res.status(400).json({ message: "All fields are required." });
        }
        
       

        const newProduct = new Product({
            productName,
            brand,
            price,
            color,
            category,
            stockCount,
            description,
            images: imagePath

        })
        newProduct.save()

        res.status(StatusCodes.OK).json({ success: true })
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Failed to add product');
    }
};



const loadEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        const categories = await Category.find({ isListed: true })

        if (!product) {
            return res.status(StatusCodes.NOT_FOUND).send('Product not found');
        }

        res.render('admin/editproduct', { product, categories });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to load product details');
    }
};




const updateProduct = async (req, res) => {
    try {

        const { productName, brand, price, color, category, stockCount, description } = req.body;
        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Product not found',
            });

        }
        product.productName = productName;
        product.brand = brand;
        product.price = price;
        product.color = color;
        product.stockCount = stockCount;
        product.category = category;
        product.description = description


        let updatedImages = [...product.images];

        console.log(req.files);
        console.log(updatedImages);



        if (req.files && req.files.length > 0) {
            req.files.forEach((file) => {
                const newImagePath = `/uploads/${file.filename}`;
                console.log(file);

                const index = file.fieldname.split('-').pop();

                if (updatedImages[index]) {
                    updatedImages[index] = newImagePath;
                } else {
                    updatedImages.push(newImagePath);
                }
            });
        }

        product.images = updatedImages;


        await product.save();

        res.status(StatusCodes.OK).json({ success: true, message: 'Product updated successfully!' });

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Error updating product' });
    }
};


const getProductDetails = async (req, res) => {

    try {
        const product = await Product.findById(req.params.id);
        res.json(product);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Failed to fetch product details');
    }
};


const listUnlistProduct = async (req, res) => {
    try {
        console.log('list');

        const { id } = req.params;

        const product = await Product.findById(id);
        if (product) {
            product.isListed = !product.isListed;
            await product.save();
            res.redirect('/admin/products');
        } else {
            res.status(StatusCodes.NOT_FOUND).send('Product not found');
        }
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Failed to list/unlist product');
    }
};




module.exports = {
    loadProducts, addProduct, updateProduct,
    getProductDetails, loadEditProduct, listUnlistProduct,
    loadAddproduct
};
