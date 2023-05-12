const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config()
// configuration
let cloud_name=process.env.cloud_name;
let key=process.env.cloudinary_api_key;
let secret=process.env.cloudinary_secret

cloudinary.config({
    cloud_name: cloud_name,
    api_key:  key,
    api_secret: secret
});

// upload
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ecommerce-products',
        allowedFormats: ['jpg', 'jpeg', 'png','webp'],
        public_id: (req, file) => {
            console.log(file);
            // remove the file extension from the file name
            const fileName = file.originalname.split('.').slice(0, -1).join('.');
            return fileName+new Date;
        },
    },
});

const upload = multer({ storage: storage }).array('images', 10);

module.exports = upload;