import express from 'express';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, getAllUsers);

// Create new user (admin only)
router.post('/', auth, createUser);

// Update user (admin only)
router.put('/:id', auth, updateUser);

// Delete user (admin only)
router.delete('/:id', auth, deleteUser);

export default router; 