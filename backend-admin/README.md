# Admin Backend

Backend API for the booking system administration panel.

## Features

- **Authentication**: JWT-based authentication for admin users
- **Booking Management**: CRUD operations for bookings with filtering and pagination
- **Statistics**: Booking statistics and analytics
- **Validation**: Input validation for all endpoints
- **Security**: Helmet, CORS, and authentication middleware

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment variables**:
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

3. **Database setup**:
   - Ensure MongoDB is running
   - Update `MONGODB_URI` in `.env`

4. **Create default admin**:
   ```bash
   npm run dev
   ```
   Then make a POST request to `/api/auth/create-default-admin`

5. **Start development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/create-default-admin` - Create default admin user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/change-password` - Change password (protected)

### Bookings

- `GET /api/bookings` - Get all bookings with pagination and filtering
- `GET /api/bookings/stats` - Get booking statistics
- `GET /api/bookings/:id` - Get single booking
- `PATCH /api/bookings/:id/status` - Update booking status
- `PUT /api/bookings/:id` - Update booking details
- `DELETE /api/bookings/:id` - Delete booking

### Health Check

- `GET /health` - Server health check

## Query Parameters

### Bookings List
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `status` - Filter by status (pending, confirmed, cancelled, completed)
- `search` - Search in customer name, email, or phone

## Request Examples

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Get Bookings
```bash
curl -X GET "http://localhost:5001/api/bookings?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Booking Status
```bash
curl -X PATCH http://localhost:5001/api/bookings/BOOKING_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"status": "confirmed"}'
```

## Environment Variables

- `PORT` - Server port (default: 5001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `FRONTEND_URL` - Frontend URL for CORS

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Security

- JWT authentication for protected routes
- Input validation on all endpoints
- CORS configuration
- Helmet security headers
- Password hashing with bcrypt

## Database Models

### User
- `email` - Admin email (unique)
- `password` - Hashed password
- `role` - User role (admin)
- `createdAt` - Creation timestamp

### Booking
- `customer` - Customer information (firstName, lastName, email, phone)
- `service` - Service type
- `date` - Booking date
- `time` - Booking time
- `status` - Booking status
- `notes` - Additional notes
- `createdAt` - Creation timestamp 