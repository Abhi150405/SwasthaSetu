import { Router } from 'express';
import { loginDoctor, logoutDoctor, registerDoctor } from '../controllers/doctor.controller.js'
import { verifyJWT } from '../middlewares/auth.middlewares.js'

const router = Router();

router.post("/register-doctor", registerDoctor);
router.route('/login-doctor').post(loginDoctor);

router.use(verifyJWT);
router.route('/logout-doctor').post(logoutDoctor);

export default router;