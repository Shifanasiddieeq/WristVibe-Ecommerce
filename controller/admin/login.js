const Admin = require('../../model/adminModel');
const bcrypt = require('bcrypt');
const StatusCodes = require('../../utils/statusCode');


const loadLogin = async (req,res) =>{
    res.render('admin/login')
}


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

       
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.render('admin/login', {
                errorMessage: "Invalid email or password.",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return res.render('admin/login', {
                errorMessage: "Invalid email or password.",
            });
        }
        req.session.admin = true;
         res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
}


const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Something went wrong. Please try again.');
        }
        res.clearCookie('connect.sid');
        res.redirect('/admin/login'); 
    });
};


module.exports = {
    loadLogin,
    login,logout
}