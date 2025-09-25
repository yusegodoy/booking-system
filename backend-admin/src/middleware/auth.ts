import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔐 Auth middleware - URL:', req.url, 'Token present:', !!token);
    
    if (!token) {
      console.log('❌ Auth middleware - No token provided');
      res.status(401).json({ message: 'No token, authorization denied' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
      res.status(500).json({ message: 'JWT_SECRET not configured' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      res.status(401).json({ message: 'Token is not valid' });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ message: 'User account is deactivated' });
      return;
    }

    req.user = user;
    console.log('✅ Auth middleware - User authenticated:', user.email, 'Role:', user.role);
    next();
  } catch (error) {
    console.log('❌ Auth middleware - Token validation failed:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireManager = requireRole(['admin', 'manager']);
export const requireOperator = requireRole(['admin', 'manager', 'operator']); 