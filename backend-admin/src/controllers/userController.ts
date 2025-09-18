import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

interface AuthRequest extends Request {
  user?: any;
}

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await User.find({}, '-password');
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Create new user
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { firstName, lastName, email, password, role, isActive } = req.body;

    // Check if user with same email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: role || 'operator',
      isActive: isActive !== undefined ? isActive : true
    });

    await newUser.save();

    // Return user without password
    const { password: _, ...userResponse } = newUser.toObject();
    return res.status(201).json(userResponse);
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { firstName, lastName, email, password, role, isActive } = req.body;

    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase() !== existingUser.email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      if (emailExists) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }
    }

    // Update fields
    existingUser.firstName = firstName || existingUser.firstName;
    existingUser.lastName = lastName || existingUser.lastName;
    existingUser.email = email ? email.toLowerCase() : existingUser.email;
    existingUser.role = role || existingUser.role;
    existingUser.isActive = isActive !== undefined ? isActive : existingUser.isActive;

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(12);
      existingUser.password = await bcrypt.hash(password, salt);
    }

    await existingUser.save();

    // Return user without password
    const { password: _, ...userResponse } = existingUser.toObject();
    return res.json(userResponse);
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (user.id === id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(id);
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Something went wrong!' });
  }
}; 