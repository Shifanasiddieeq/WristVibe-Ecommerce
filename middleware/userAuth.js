const userModel = require('../model/userModel')

const checkSession = async (req, res, next) => {
    const user = await userModel.findById(req.session.user)
     if(user){
        if(req.session.user &&  user.isBlocked === false){
                       
            next()
        }else{
        
            req.session.user=null
            res.redirect('/login')
        }
     }else{
      
        
        res.redirect('/login')
     }



};




const isLogin = async(req, res, next) => {
    
    const user = await userModel.findById(req.session.user)
    if (!user) {
        next();
    } else if(req.session.user && user.isBlocked === false){
        res.redirect('/home');
    }else{
        res.redirect('/login');
    }
};


module.exports = {
    checkSession,
    isLogin
}