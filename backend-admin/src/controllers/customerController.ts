import { Request, Response } from 'express';
import { Customer } from '../models/Customer';

interface AuthRequest extends Request {
  user?: any;
}

// Get all customers with search and pagination
export const getAllCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build search query
    let searchQuery: any = {};
    if (search && typeof search === 'string') {
      searchQuery = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const customers = await Customer.find(searchQuery)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Customer.countDocuments(searchQuery);

    return res.json({
      customers,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalCustomers: total,
        hasNextPage: skip + customers.length < total,
        hasPrevPage: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Get customer by ID
export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const customer = await Customer.findById(id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Create new customer
export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const customerData = req.body;
    
    // Check if customer with same email already exists
    const existingCustomer = await Customer.findOne({ email: customerData.email });
    if (existingCustomer) {
      return res.status(400).json({ message: 'A customer with this email already exists' });
    }

    const newCustomer = new Customer(customerData);
    const savedCustomer = await newCustomer.save();

    return res.status(201).json(savedCustomer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Update customer
export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const updateData = req.body;

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const existingCustomer = await Customer.findOne({ 
        email: updateData.email, 
        _id: { $ne: id } 
      });
      if (existingCustomer) {
        return res.status(400).json({ message: 'A customer with this email already exists' });
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.json(updatedCustomer);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Delete customer
export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Get customer statistics
export const getCustomerStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ isActive: true });
    const totalRevenue = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$totalSpent' } } }
    ]);

    const topCustomers = await Customer.find()
      .sort({ totalSpent: -1 })
      .limit(5)
      .select('firstName lastName totalSpent totalBookings');

    return res.json({
      totalCustomers,
      activeCustomers,
      totalRevenue: totalRevenue[0]?.total || 0,
      topCustomers
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return res.status(500).json({ message: 'Something went wrong!' });
  }
}; 

// Search customers for autocomplete
export const searchCustomers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const searchQuery = query.trim();
    
    if (searchQuery.length < 1) {
      return res.json({ customers: [] });
    }

    // Search by firstName, lastName, email (username part), or phone (contains digits)
    const customers = await Customer.find({
      $or: [
        { firstName: { $regex: `^${searchQuery}`, $options: 'i' } },
        { lastName: { $regex: `^${searchQuery}`, $options: 'i' } },
        { email: { $regex: `^${searchQuery}@`, $options: 'i' } }, // Email starts with username@
        { phone: { $regex: searchQuery.replace(/[^\d]/g, ''), $options: 'i' } } // Phone contains digits
      ],
      isDeleted: { $ne: true }
    })
    .select('firstName lastName email phone')
    .limit(10)
    .sort({ createdAt: -1 });

    return res.json({ customers });
  } catch (error) {
    console.error('Error searching customers:', error);
    return res.status(500).json({ message: 'Error searching customers' });
  }
}; 