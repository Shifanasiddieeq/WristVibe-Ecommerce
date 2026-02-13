const Address=require('../../model/addressModel')
const User = require('../../model/userModel')
const StatusCodes = require('../../utils/statusCode')

    const loadAddress = async(req,res)=>{
        try {
        const userId = req.session.user
        const user= await User.findById(userId)
        const page=parseInt(req.query.page) || 1
        const limit=2
        const skip=(page-1)*limit
        const totalAddress=await Address.countDocuments({userId})

        const address=await Address.find({userId}).skip(skip).limit(limit)
        const totalPages=Math.ceil(totalAddress/limit)
        res.render('user/address',{
             user,address ,
             currentPage:page,
             totalPages,

            })
     }
    catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Failed to load addresses');
    }
}
const addAddress= async(req,res)=>{
    res.render('user/addaddress')

}

const saveAddres=async(req,res)=>{
 try{
        
        const { houseNo, area, landmark, town, pincode, state } = req.body;
    
        if (!houseNo || !area || !landmark || !town || !pincode || !state) {
           
            return false
        }

        const userId=req.session.user
    
       
        const newAddress =  new Address({ houseNo, area, landmark, town, pincode, state ,userId});
        newAddress.save()
       console.log(newAddress);
    
    
        res.redirect('/address'); 
      
    }catch (error) {
    console.error('Error saving address:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error. Please try again later.' });
}
}
 
const editAddress=async(req,res)=>{

    try {
        const addressId = req.params.id;
        const address = await Address.findById(addressId); 

        if (!address) {
            return res.status(StatusCodes.NOT_FOUND).send('Address not found');
        }

        res.render('user/editaddress', { address });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Failed to load Address');
    }


}

const saveEditedAddress=async(req,res)=>{

    try {
        console.log(req.body);
        
        const { houseNo, area, landmark, town, pincode, state } = req.body;
        
      
        const updatedAddress = {
            houseNo,
            area,
            landmark,
            town,
            pincode,
            state
        };

       
        const address = await Address.findByIdAndUpdate(req.params.id, updatedAddress, { new: true });
        console.log(req.params.id);
        

        if (!address) {
            return res.status(404).send('Address not found');
        }

        res.redirect('/address');
    } catch (error) {
      
        console.error(error);
        res.status(500).send('Server Error');
    }

}

const deleteAddress = async(req,res)=>{
           try {
            const { id } = req.params; 
            console.log(id);
            
    
            const deletedAddress = await Address.findByIdAndDelete(id);
    
            if (!deletedAddress) {
                return res.status(404).send('Address not found');
            }
    
         
            res.status(200).json({ message: 'Sucessfully address deleted' })
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
}

module.exports={
    loadAddress,addAddress,saveAddres,editAddress,saveEditedAddress,deleteAddress
}