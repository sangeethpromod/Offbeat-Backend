import { Router } from 'express';
import {
  createBooking,
  validateBooking,
} from '../Controller/Booking/bookingController';
import { verifyAccessToken } from '../Middleware/tokenManagement';

const bookingRoutes = Router();

// Apply authentication middleware to all booking routes
bookingRoutes.use(verifyAccessToken);

// POST /api/bookings - Create a new booking
bookingRoutes.post('/create-booking', validateBooking, createBooking);

export default bookingRoutes;
