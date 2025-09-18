import express from 'express';
import {
  login,
  getMe,
  changePassword,
  createDefaultAdmin
} from '../controllers/authController';
import { auth } from '../middleware/auth';
import { validateLogin, validateChangePassword } from '../middleware/validation';

const router = express.Router();

// Public routes
router.post('/login', validateLogin, login);
router.post('/create-default-admin', createDefaultAdmin);

// Protected routes
router.get('/me', auth, getMe);
router.post('/change-password', auth, validateChangePassword, changePassword);

export default router; 