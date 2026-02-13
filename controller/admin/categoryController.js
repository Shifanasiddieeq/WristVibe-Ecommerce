const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const StatusCodes = require('../../utils/statusCode');


const loadCategories = async(req,res)=>{
    const page=parseInt(req.query.page) || 1
    const limit=5;
    const skip=(page -1)* limit
    try{
        const totalCategory=await Category.countDocuments()
        const categories= await Category.find().skip(skip).limit(limit)
        const totalPages=Math.ceil(totalCategory/limit)
        res.render('admin/category',{
            categories,
            currentPage:page,
            totalPages,
            error: null, success: null 
        })
    
    }
    catch(error){
        console.error(error)
       res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('server error')

    }
}





const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !description) {
            const error = 'Name and Description cannot be empty.';
            return res.render('admin/categories', { error, success: null, categories: await Category.find() });
        }

        let normalizedInputName = name.toLowerCase().split(' ');
        console.log(normalizedInputName);
        
        let word =''
        for(let x of normalizedInputName){
            if(x !=''){
                 word = word + ' ' + x
                 
            }
        }

        word = word.trim()

        const oldCategory = await Category.findOne({
            name: { $regex: `^${word}$`, $options: 'i' } 
        });

        console.log(oldCategory);
        

        if (oldCategory) {
            const error = 'Category name already exists.';
        
            return res.status(400).json({success:null,message:error})
        }


        const newCategory = new Category({ 
            name: name.trim(), 
            description 
        });
        await newCategory.save();

        res.status(200).json({success:false})
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Failed to add category');
    }
};



const editCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name || !description) {
            const categories = await Category.find();
            return res.render('admin/category', {
                categories,
                error: 'Name and Description cannot be empty.',
                success: null,
            });
        }

        let normalizedInputName = name.toLowerCase().trim().split(/\s+/).join(' ');

        console.log('Normalized name:', normalizedInputName);

        const existingCategory = await Category.findOne({
            name: { $regex: `^${normalizedInputName}$`, $options: 'i' },
            _id: { $ne: id } 
        });

        if (existingCategory) {
            console.log('Category already exists');
            return res.redirect('/admin/categories');
        }

        await Category.findByIdAndUpdate(id, { name: normalizedInputName, description });
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Failed to edit category');
    }
};



const categoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(StatusCodes.NOT_FOUND).send('Category not found');
        }


        category.isListed = !category.isListed;
        await category.save();

   

        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.NOT_FOUND).send('Failed to toggle category status');
    }
};



module.exports = {
    loadCategories,
    addCategory,
    editCategory,
    categoryStatus
};
