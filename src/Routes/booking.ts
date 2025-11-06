import { Router } from 'express';
import {
  createBooking,
  validateBooking,
} from '../Controller/Booking/bookingController';
import { getBookingsByDate } from '../Controller/Booking/bookingCheckController';
import { verifyAccessToken } from '../Middleware/tokenManagement';

const bookingRoutes = Router();

// Apply authentication middleware to all booking routes
bookingRoutes.use(verifyAccessToken);

// POST /api/bookings - Create a new booking
bookingRoutes.post('/create-booking', validateBooking, createBooking);

// POST /api/bookings/analytics - Get booking analytics for a specific date
bookingRoutes.post('/analytics', getBookingsByDate);

export default bookingRoutes;
