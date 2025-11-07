import { Router } from 'express';
import {
  createBooking,
  validateBooking,
} from '../Controller/Booking/HostSide/bookStoryController';
import { getTravellerBookings } from '../Controller/Booking/HostSide/bookingListSummaryController';
import { getBookingsByDate } from '../Controller/Booking/HostSide/bookingAnalyticsController';
import { verifyAccessToken } from '../Middleware/tokenManagement';

const bookingRoutes = Router();

// Apply authentication middleware to all booking routes
bookingRoutes.use(verifyAccessToken);

// POST /api/bookings - Create a new booking
bookingRoutes.post('/create-booking', validateBooking, createBooking);

// GET /api/bookings/traveller-bookings - Get traveller's categorized bookings (Past/Upcoming)
bookingRoutes.get('/traveller-bookings', getTravellerBookings);

// POST /api/bookings/analytics - Get booking analytics for a specific date
bookingRoutes.post('/analytics', getBookingsByDate);

export default bookingRoutes;
