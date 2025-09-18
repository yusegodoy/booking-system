import express from 'express';
import { 
  getAllCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer, 
  getCustomerStats,
  searchCustomers
} from '../controllers/customerController';
import { auth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all customers with search and pagination
router.get('/', getAllCustomers);

// Get customer statistics
router.get('/stats', getCustomerStats);

// Search customers for autocomplete
router.get('/search/autocomplete', searchCustomers);

// Get customer by ID
router.get('/:id', getCustomerById);

// Create new customer
router.post('/', createCustomer);

// Update customer
router.put('/:id', updateCustomer);

// Delete customer
router.delete('/:id', deleteCustomer);

export default router; 