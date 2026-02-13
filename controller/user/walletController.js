
const walletSchema = require("../../model/walletModel");
const userSchema = require('../../model/userModel');


const loadWallet = async (req, res) => {
  try {
    const userId = req.session.user;
    const page = parseInt(req.query.page) || 1; 
    const limit = 5; 
    const skip = (page - 1) * limit;

    const user = await userSchema.findById(userId);
    const wallet = await walletSchema.findOne({ userId });

    if (!wallet) {
      const newWallet = await walletSchema.create({ userId });
      return res.render('user/wallet', { user, wallet: newWallet,transactions:null, currentPage: page, totalPages: 1 });
    }

    const totalTransactions = wallet.transactions.length; 
    const totalPages = Math.ceil(totalTransactions / limit);

    const paginatedTransactions = wallet.transactions.slice(skip, skip + limit);

    res.render('user/wallet', {
      user,
      wallet: wallet,
      transactions: paginatedTransactions,
      currentPage: page,
      totalPages: totalPages
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load wallet data." });
  }
};



module.exports = {
  loadWallet,
};
