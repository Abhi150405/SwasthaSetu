import { Router } from 'express';

import { upload } from '../middlewares/multer.middleware.js'; // Import the upload middleware
import { loginPatient, logoutPatient, registerPatient } from '../controllers/patient.controller.js'
import { verifyJWT } from '../middlewares/auth.middlewares.js'

const router = Router();

router.post(
  "/register-patient",
  upload.fields([{ name: "medical_history", maxCount: 5 }]),
  registerPatient
);

router.route('/login-patient').post(loginPatient)

router.use(verifyJWT)
router.route('/logout-patient').post(logoutPatient)

export default router;