// const storage = multer.diskStorage(
//     {
//         destination: (req, file, cb) => {
//             cb(null, 'uploads/'); // Save images in "uploads" folder
//         },
//         filename: (req, file, cb) => {
//             cb(null, Date.now() + '-' + file.originalname); // Unique file name
//         }
//     }
// )



const multer = require('multer')

const {CloudinaryStorage} = require ('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary')



const storage = new CloudinaryStorage({
    cloudinary:cloudinary,
    params:{
        folder:'CubeCraze/brands',
        format: async (req,file)=> file.mimetype === 'image/png' ? 'png' :'jpg',
        public_id: (req,file) => Date.now() + '-' + file.originalname.replace(/\s+/g,'-'),
       // transformation:[{width:200,height:200,crop:'fit'}]
    }
})

const upload = multer({storage,})

module.exports = upload