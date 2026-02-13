const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './public/uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /jpeg|jpg|png/;
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, and .png files are allowed!'));
        }
    }
});


module.exports = { upload };
