const User = require('../../model/userModel')



const userpage =async (req, res) =>{
 
    const page = parseInt(req.query.page) || 1; 
    const limit = 5; 
    const skip = (page - 1) * limit; 

    try {
        const totalUsers = await User.countDocuments(); 
        const users = await User.find() 
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalUsers / limit); 

        res.render('admin/users', {
            users,
            currentPage: page,
            totalPages,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}


const userblock = async(req,res)=>{
    try {
        const { block } = req.body;
        
        const userId = req.params.id;

        
        const updatedUser = await User.findByIdAndUpdate(userId, { isBlocked: block }, { new: true });
        
        if (updatedUser) {
            const status = block ? 'Blocked' : 'Unblocked';
            console.log('user block cntroller',updatedUser);
            return res.json({ success: true, message: `User ${status} successfully` });
        } else {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
    } 
    catch (error) {
        console.error(error);   
        res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
}

module.exports = {
    userpage,userblock
}