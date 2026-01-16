import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = process.env.NODE_ENV === "production" ? "/tmp" : "./public/temp";
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

export const upload = multer({ storage });
