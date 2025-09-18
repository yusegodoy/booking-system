import { Request, Response, NextFunction } from 'express';
import { isValidEmail, isValidPassword, isValidObjectId } from '../utils/validation';

// Validation middleware for login
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  return next();
};

// Validation middleware for change password
export const validateChangePassword = (req: Request, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password must be different from current password' });
  }

  return next();
};

// Validation middleware for booking ID
export const validateBookingId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid booking ID format' });
  }

  return next();
};

// Validation middleware for booking status update
export const validateBookingStatus = (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  const validStatuses = ['Unassigned', 'Assigned', 'On the way', 'Arrived', 'Customer in car', 'Customer dropped off', 'Customer dropped off - Pending payment', 'Done', 'No Show', 'Canceled'];

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be one of: Unassigned, Assigned, On the way, Arrived, Customer in car, Customer dropped off, Customer dropped off - Pending payment, Done, No Show, Canceled' });
  }

  return next();
};

// Validation middleware for pagination
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit } = req.query;

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({ message: 'Page must be a positive number' });
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return res.status(400).json({ message: 'Limit must be a number between 1 and 100' });
  }

  return next();
}; 