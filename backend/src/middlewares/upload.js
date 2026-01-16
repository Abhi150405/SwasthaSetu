import multer from 'multer';

// Configure storage destination and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp'); // The directory where files will be stored temporarily
  },
  filename: function (req, file, cb) {
    // A unique filename to prevent conflicts
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({ 
  storage: storage 
});