

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Allowed mime types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'CubeCraze/brands',
    format: async (req, file) => {
      if (file.mimetype === 'image/png') return 'png';
      if (file.mimetype === 'image/webp') return 'webp';
      return 'jpg'; // Default fallback
    },
    public_id: (req, file) => {
      const originalNameWithoutExt = file.originalname.replace(/\s+/g, '-').replace(/\.[^/.]+$/, '');
      return Date.now() + '-' + originalNameWithoutExt;
    }
        // Optional image transformation
    // transformation: [{ width: 200, height: 200, crop: 'fit' }]
  }
});

// File filter to accept only jpg, png, or webp
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only .jpg, .png, or .webp image formats are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter
});

module.exports = upload;
