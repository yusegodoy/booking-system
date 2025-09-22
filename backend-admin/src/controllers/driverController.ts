import { Request, Response } from 'express';
import { Driver } from '../models/Driver';
import { Vehicle } from '../models/Vehicle';
import { Booking } from '../models/Booking';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/drivers');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'driver-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Generate JWT token
const generateToken = (driverId: string) => {
  return jwt.sign({ driverId, role: 'driver' }, JWT_SECRET, { expiresIn: '7d' });
};

// Driver Authentication
export const driverLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const driver = await Driver.findOne({ email }).populate('vehicleAssigned');
    
    if (!driver) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!driver.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    const isPasswordValid = await driver.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    driver.lastLogin = new Date();
    await driver.save();

    const token = generateToken((driver._id as any).toString());

    return res.json({
      message: 'Login successful',
      token,
      driver: {
        _id: driver._id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        isAvailable: driver.isAvailable,
        vehicleAssigned: driver.vehicleAssigned,
        rating: driver.rating,
        totalTrips: driver.totalTrips,
        totalEarnings: driver.totalEarnings
      }
    });
  } catch (error) {
    console.error('Driver login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Driver Registration (Admin only)
export const registerDriver = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      licenseNumber,
      licenseExpiry,
      emergencyContact
    } = req.body;

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ 
      $or: [{ email }, { licenseNumber }] 
    });

    if (existingDriver) {
      return res.status(400).json({ 
        message: 'Driver with this email or license number already exists' 
      });
    }

    const driver = new Driver({
      firstName,
      lastName,
      email,
      password,
      phone,
      licenseNumber,
      licenseExpiry,
      emergencyContact
    });

    await driver.save();

    return res.status(201).json({
      message: 'Driver registered successfully',
      driver: {
        _id: driver._id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        isActive: driver.isActive,
        isAvailable: driver.isAvailable
      }
    });
  } catch (error) {
    console.error('Driver registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all drivers
export const getAllDrivers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    
    const query: any = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'available') {
      query.isAvailable = true;
      query.isActive = true;
    } else if (status === 'unavailable') {
      query.isAvailable = false;
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const drivers = await Driver.find(query)
      .populate('vehicleAssigned')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-password');

    const total = await Driver.countDocuments(query);

    return res.json({
      drivers,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        totalDrivers: total
      }
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get driver by ID
export const getDriverById = async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('vehicleAssigned')
      .select('-password');

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    return res.json(driver);
  } catch (error) {
    console.error('Get driver error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update driver
export const updateDriver = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      licenseExpiry,
      emergencyContact,
      schedule,
      isActive,
      isAvailable,
      vehicleAssigned
    } = req.body;

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update fields
    if (firstName) driver.firstName = firstName;
    if (lastName) driver.lastName = lastName;
    if (phone) driver.phone = phone;
    if (licenseExpiry) driver.licenseExpiry = licenseExpiry;
    if (emergencyContact) driver.emergencyContact = emergencyContact;
    if (schedule) driver.schedule = schedule;
    if (typeof isActive === 'boolean') driver.isActive = isActive;
    if (typeof isAvailable === 'boolean') driver.isAvailable = isAvailable;
    if (vehicleAssigned) driver.vehicleAssigned = vehicleAssigned;

    await driver.save();

    return res.json({
      message: 'Driver updated successfully',
      driver: {
        _id: driver._id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        isActive: driver.isActive,
        isAvailable: driver.isAvailable,
        vehicleAssigned: driver.vehicleAssigned
      }
    });
  } catch (error) {
    console.error('Update driver error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete driver
export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Check if driver has active bookings
    const activeBookings = await Booking.find({
      assignedDriver: driver._id,
      status: { $in: ['confirmed', 'in-progress'] }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete driver with active bookings' 
      });
    }

    await Driver.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Delete driver error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update driver availability
export const updateDriverAvailability = async (req: Request, res: Response) => {
  try {
    const { isAvailable, currentLocation } = req.body;
    const driverId = req.params.id;

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (typeof isAvailable === 'boolean') {
      driver.isAvailable = isAvailable;
    }

    if (currentLocation) {
      driver.currentLocation = currentLocation;
    }

    await driver.save();

    return res.json({
      message: 'Driver availability updated successfully',
      driver: {
        _id: driver._id,
        isAvailable: driver.isAvailable,
        currentLocation: driver.currentLocation
      }
    });
  } catch (error) {
    console.error('Update driver availability error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get driver statistics
export const getDriverStats = async (req: Request, res: Response) => {
  try {
    const driverId = req.params.id;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Get driver's bookings
    const bookings = await Booking.find({ assignedDriver: driverId });
    
    const stats = {
      totalTrips: bookings.length,
      completedTrips: bookings.filter(b => b.status === 'Done').length,
      pendingTrips: bookings.filter(b => b.status === 'Unassigned').length,
      inProgressTrips: bookings.filter(b => b.status === 'On the way' || b.status === 'Arrived' || b.status === 'Customer in car').length,
      totalEarnings: bookings
        .filter(b => b.status === 'Done')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      averageRating: driver.rating,
      thisMonthTrips: bookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        const now = new Date();
        return bookingDate.getMonth() === now.getMonth() && 
               bookingDate.getFullYear() === now.getFullYear();
      }).length,
      thisMonthEarnings: bookings
        .filter(b => {
          const bookingDate = new Date(b.createdAt);
          const now = new Date();
          return bookingDate.getMonth() === now.getMonth() && 
                 bookingDate.getFullYear() === now.getFullYear() &&
                 b.status === 'Done';
        })
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    };

    return res.json(stats);
  } catch (error) {
    console.error('Get driver stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get driver's bookings
export const getDriverBookings = async (req: Request, res: Response) => {
  try {
    const driverId = req.params.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query: any = { assignedDriver: driverId };
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const bookings = await Booking.find(query)
      .populate('assignedVehicle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(query);

    return res.json({
      bookings,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        totalBookings: total
      }
    });
  } catch (error) {
    console.error('Get driver bookings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update driver documents
export const updateDriverDocuments = async (req: Request, res: Response) => {
  try {
    const { documents } = req.body;
    const driverId = req.params.id;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (documents) {
      driver.documents = { ...driver.documents, ...documents };
    }

    await driver.save();

    return res.json({
      message: 'Driver documents updated successfully',
      documents: driver.documents
    });
  } catch (error) {
    console.error('Update driver documents error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get available drivers
export const getAvailableDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await Driver.find({
      isActive: true,
      isAvailable: true
    })
    .populate('vehicleAssigned')
    .select('firstName lastName phone vehicleAssigned currentLocation rating totalTrips');

    return res.json(drivers);
  } catch (error) {
    console.error('Get available drivers error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Assign vehicle to driver
export const assignVehicleToDriver = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.body;
    const driverId = req.params.id;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      driver.vehicleAssigned = vehicleId;
    } else {
      driver.vehicleAssigned = undefined;
    }

    await driver.save();

    return res.json({
      message: 'Vehicle assignment updated successfully',
      driver: {
        _id: driver._id,
        vehicleAssigned: driver.vehicleAssigned
      }
    });
  } catch (error) {
    console.error('Assign vehicle error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get driver profile (for driver dashboard)
export const getDriverProfile = async (req: Request, res: Response) => {
  try {
    const driverId = req.params.driverId || req.body.driverId;
    
    if (!driverId) {
      return res.status(400).json({ message: 'Driver ID is required' });
    }

    const driver = await Driver.findById(driverId)
      .populate('vehicleAssigned')
      .select('-password');

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    return res.json(driver);
  } catch (error) {
    console.error('Get driver profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get driver's own bookings (for driver dashboard)
export const getDriverOwnBookings = async (req: Request, res: Response) => {
  try {
    const driverId = req.params.driverId || req.body.driverId;
    const { status, page = 1, limit = 10 } = req.query;

    if (!driverId) {
      return res.status(400).json({ message: 'Driver ID is required' });
    }

    const query: any = { assignedDriver: driverId };
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const bookings = await Booking.find(query)
      .populate('assignedVehicle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(query);

    return res.json({
      bookings,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        totalBookings: total
      }
    });
  } catch (error) {
    console.error('Get driver own bookings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Upload driver photo
export const uploadDriverPhoto = async (req: Request, res: Response) => {
  try {
    const driverId = req.params.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Delete old photo if exists
    if (driver.photo) {
      const oldPhotoPath = path.join(__dirname, '../../uploads/drivers', path.basename(driver.photo));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update driver with new photo path
    driver.photo = `/uploads/drivers/${req.file.filename}`;
    await driver.save();

    return res.json({
      message: 'Photo uploaded successfully',
      photo: driver.photo
    });
  } catch (error) {
    console.error('Upload driver photo error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware for handling file uploads
export const uploadMiddleware = upload.single('photo'); 