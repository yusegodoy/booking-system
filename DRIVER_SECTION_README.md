# Driver Management Section

## Overview

The Driver Management section provides comprehensive functionality for managing drivers in the transportation booking system. This includes both administrative management tools and a dedicated driver dashboard.

## Features

### 🚗 Driver Management (Admin Portal)
- **Complete CRUD operations** for driver management
- **Driver registration** with comprehensive information
- **Availability management** (active/inactive, available/unavailable)
- **Vehicle assignment** to drivers
- **Schedule management** with weekly availability settings
- **Document management** (license, insurance, background check, drug test)
- **Statistics and analytics** for each driver
- **Search and filtering** capabilities
- **Pagination** for large driver lists

### 📱 Driver Dashboard
- **Personal profile** management
- **Real-time availability** toggle
- **Location tracking** with GPS integration
- **Booking management** with detailed trip information
- **Earnings tracking** and statistics
- **Schedule viewing** and management
- **Performance metrics** and ratings

## Backend Components

### Models
- **`Driver.ts`** - Complete driver model with all necessary fields
  - Personal information (name, email, phone)
  - License and certification details
  - Availability and status tracking
  - Schedule configuration
  - Document management
  - Performance metrics (rating, trips, earnings)
  - Emergency contact information

### Controllers
- **`driverController.ts`** - Complete API endpoints for driver management
  - Authentication and registration
  - CRUD operations
  - Availability management
  - Statistics and analytics
  - Vehicle assignment
  - Document management

### Routes
- **`driverRoutes.ts`** - API route definitions
  - Admin routes (protected)
  - Driver dashboard routes
  - Authentication endpoints

## Frontend Components

### Admin Portal Integration
- **`DriverManager.tsx`** - Complete driver management interface
  - Grid view of all drivers
  - Add/edit/delete functionality
  - Status management
  - Vehicle assignment
  - Statistics viewing
  - Schedule editing

### Driver Dashboard
- **`DriverDashboard.tsx`** - Personal driver interface
  - Overview with key metrics
  - Booking management
  - Schedule viewing
  - Earnings tracking
  - Location updates

### Styling
- **`DriverManager.css`** - Admin interface styling
- **`DriverDashboard.css`** - Driver dashboard styling

## API Endpoints

### Authentication
- `POST /api/drivers/login` - Driver login
- `POST /api/drivers/register` - Driver registration (admin only)

### Admin Management
- `GET /api/drivers` - Get all drivers (with pagination and filtering)
- `GET /api/drivers/:id` - Get specific driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver
- `GET /api/drivers/available` - Get available drivers
- `PUT /api/drivers/:id/availability` - Update availability
- `GET /api/drivers/:id/stats` - Get driver statistics
- `GET /api/drivers/:id/bookings` - Get driver's bookings
- `PUT /api/drivers/:id/documents` - Update documents
- `PUT /api/drivers/:id/assign-vehicle` - Assign vehicle

### Driver Dashboard
- `GET /api/drivers/profile/:driverId` - Get driver profile
- `GET /api/drivers/bookings/:driverId` - Get driver's own bookings

## Database Schema

### Driver Model Fields
```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  vehicleAssigned?: ObjectId;
  isActive: boolean;
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents: {
    license: string;
    insurance: string;
    backgroundCheck: string;
    drugTest: string;
  };
  schedule: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
}
```

## Setup Instructions

### 1. Backend Setup
```bash
cd backend-admin
npm install
```

### 2. Database Setup
```bash
# Run the driver seeding script
npm run seed-drivers
```

### 3. Frontend Setup
```bash
cd ..
npm install
```

### 4. Environment Variables
Make sure to set up the following environment variables:
```env
MONGODB_URI=mongodb://localhost:27017/booking-admin
JWT_SECRET=your-secret-key
REACT_APP_API_BASE_URL=http://localhost:5001/api
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Usage

### Admin Portal
1. Access the admin portal
2. Navigate to the "Drivers" tab
3. Use the interface to manage drivers:
   - Add new drivers
   - Edit existing driver information
   - Manage availability and status
   - Assign vehicles
   - View statistics and performance

### Driver Dashboard
1. Drivers can access their personal dashboard
2. Toggle availability status
3. Update location using GPS
4. View assigned bookings
5. Track earnings and performance
6. Manage schedule preferences

## Sample Data

The seeding script creates 5 sample drivers with realistic data:
- John Smith (Active, Available)
- Sarah Johnson (Active, Available)
- Robert Williams (Active, Unavailable)
- Maria Garcia (Active, Available)
- David Brown (Inactive, Unavailable)

## Security Features

- **Password hashing** using bcrypt
- **JWT authentication** for secure access
- **Role-based access control** (admin vs driver)
- **Input validation** and sanitization
- **Protected routes** for sensitive operations

## Future Enhancements

- **Real-time notifications** for new bookings
- **Push notifications** for mobile apps
- **Advanced analytics** and reporting
- **Driver performance reviews**
- **Automated scheduling** based on availability
- **Integration with GPS tracking systems**
- **Driver rating system** from customers
- **Commission and payment tracking**

## Troubleshooting

### Common Issues

1. **Driver not appearing in list**
   - Check if driver is marked as active
   - Verify database connection
   - Check for any validation errors

2. **Location updates not working**
   - Ensure browser has location permissions
   - Check Google Maps API key configuration
   - Verify GPS is enabled on device

3. **Authentication issues**
   - Verify JWT token is valid
   - Check token expiration
   - Ensure correct credentials

### Debug Commands
```bash
# Check driver data in database
npm run seed-drivers

# View server logs
npm run dev

# Test API endpoints
curl http://localhost:5001/api/drivers
```

## Contributing

When adding new features to the driver section:
1. Update the model if new fields are needed
2. Add corresponding controller methods
3. Create new routes if necessary
4. Update the frontend components
5. Add appropriate styling
6. Update this documentation

## Support

For issues related to the driver management system:
1. Check the console logs for errors
2. Verify all environment variables are set
3. Ensure database is running and accessible
4. Test API endpoints directly
5. Check browser developer tools for frontend issues 