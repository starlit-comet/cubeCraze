const multer = require('multer')

const storage = multer.diskStorage(
    {
        destination: (req, file, cb) => {
            cb(null, 'uploads/'); // Save images in "uploads" folder
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname); // Unique file name
        }
    }
)

const upload = multer({storage})

module.exports = upload