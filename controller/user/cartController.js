const Cart=require('../../model/cartModel')
const Productschema = require('../../model/productModel');
const StatusCodes = require('../../utils/statusCode');
const Offer = require('../../model/offerModel')
const categorySchema = require('../../model/categoryModel');
const { findBestOffer } = require('../../Service/bestOffer');
const productModel = require('../../model/productModel');




const loadCart = async (req, res) => {
    try {
               
        const userId = req.session.user; 
       
        
        if (!userId) {
            return res.redirect('/login'); 
        }
 
        const userCart = await Cart.findOne({ userId }).populate('items.productId');
      
  
        res.render('user/cart', { cart: userCart || { items: [] } ,cartTotalPrice: 0,
  
        }
        ); 
    } catch (error) {
        console.error('Error loading cart:', error);
        res.status(500).send('Internal Server Error');
    }
};




const updateQuantity = async (req, res) => {
    try {
        const { productId, newQuantity } = req.body;
        const userId = req.session.user;

        if (!userId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'User not logged in' });
        }

        const quantity = parseInt(newQuantity, 10);
        if (!productId || isNaN(quantity) || quantity < 1 || quantity > 5) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid product ID or quantity' });
        }


        const userCart = await Cart.findOne({ userId }).populate('items.productId');

        if (!userCart) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Cart not found' });
        }

     
        const productIndex = userCart.items.findIndex(item => item.productId._id.toString() === productId);
        if (productIndex === -1) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Product not in cart' });
        }

        const product = userCart.items[productIndex];
        const pricePerUnit = product.price;
        const availableStock = product.productId.stockCount; 

       
        if (quantity > availableStock) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: `You can only select up to ${availableStock} of this product` });
        }

        product.quantity = quantity;
        product.totalPrice = pricePerUnit * quantity;

      
        let cartTotalPrice = 0;
        userCart.items.forEach(item => {
            cartTotalPrice += item.totalPrice;
        });
        userCart.cartTotalPrice = cartTotalPrice;

      
        await userCart.save();

        
        res.json({
            price: pricePerUnit,
            totalPrice: product.totalPrice,
            cartTotalPrice: userCart.cartTotalPrice,
        });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



const addtoCart = async (req, res) => {
    try {
        const { productId,price } = req.body;
        const userId = req.session.user;
        const price1 = Number(price)
        

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

                
        const product = await Productschema.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stockCount <= 0) {
            return res.status(400).json({ message: 'Product is out of stock' });
        }

        let userCart = await Cart.findOne({ userId });

        if (!userCart) {
         
            userCart = new Cart({
                userId,
                items: [
                    {
                        productId,
                        quantity: 1,
                        price: price1,
                        totalPrice: price1,
                    }
                ],
                cartTotalPrice: price1,
            });
        } else {
           
            const productIndex = userCart.items.findIndex(item => item.productId.toString() === productId);

            if (productIndex > -1) {
                const currentQuantity = userCart.items[productIndex].quantity;
                const maxAllowedQuantity = 5;

        
                if (currentQuantity >= maxAllowedQuantity) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ message: `You can only add up to ${maxAllowedQuantity} of this product.` });
                }

                const availableStock = product.stockCount;
                if (currentQuantity + 1 > availableStock) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ message: `Only ${availableStock} of this product are available in stock.` });
                }

                userCart.items[productIndex].quantity += 1;
                userCart.items[productIndex].totalPrice += price1;
            } else {
                
                userCart.items.push({
                    productId,
                    quantity: 1,
                    price: price1,
                    totalPrice: price1,
                });
            }

          
            userCart.cartTotalPrice += price1;
        }

        
        await userCart.save();

        res.status(StatusCodes.OK).json({ success: true, message: 'Product added to cart' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
    }
};

const removeItemFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;

        if (!userId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'User not logged in' });
        }

     
        const userCart = await Cart.findOne({ userId });
        if (!userCart) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Cart not found' });
        }

        const itemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

       
        userCart.items.splice(itemIndex, 1);

        userCart.cartTotalPrice = userCart.items.reduce((total, item) => total + item.totalPrice, 0);

      
        await userCart.save();

        res.json({
            message: 'Item removed successfully',
            cartTotalPrice: userCart.cartTotalPrice,
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const proceedtoCheckout = async (req, res) => {
    const userId = req.session.user;
  
    try {

      if (!userId) {
        return res.status(401).send("Unauthorized: User not logged in");
      }
  
      const cart = await Cart.findOne({ userId }).populate('items.productId');

      
      
      if (!cart) {
          return res.status(404).send("Cart not found");
        }
        
        let cartTotalPrice = cart.cartTotalPrice;
        
        for (let item of cart.items) {
            const product = await productModel.findById(item.productId).populate('category')
            
            if (!product) {
                return res
                .status(404)
                .json({message:`Product with ID ${item.productId} not found`});
            }
            
            if (!product.isListed) {
                return res
                .status(400)
                .json({message:`Product ${product.productName} is  currently unavailable.`});
            }

      
            
            if (!product.category.isListed) {
                return res.status(400).json({
                  message: `Product ${product.productName} belongs to an unavailable category.`,
                });
              }

              

            
            if (item.quantity <= 0) {
                return res
                .status(400)
                .json({message:`Invalid quantity for product: ${product.productName}. Quantity must be greater than 0.`}
                    
                );
            }
            
            
            if (item.quantity > product.stockCount) {
                return res
                .status(400)
                .json(
                   {message: `Not enough stock for product: ${product.productName}. Available stock: ${product.stockCount}`}
                );
            }
            
       
        }
        
 
        res.status(200).json({success:true,redirect:'/checkout'})
    } catch (error) {
        console.error("Error during checkout validation:", error);
        res.status(500).send("Failed to proceed to checkout");
    }
  };
  


module.exports={loadCart,addtoCart,updateQuantity,removeItemFromCart,findBestOffer,
    proceedtoCheckout


}