import { Router } from 'express';
import {
  createBooking,
  validateBooking,
} from '../Controller/Booking/TravellerSide/bookStoryController';
import { getTravellerBookings } from '../Controller/Booking/HostSide/bookingListSummaryController';
import { getTravellerBookingsSimple } from '../Controller/Booking/TravellerSide/getTravellerBokking';
import {
  getYearRoundBookingsByDate,
  getTravelWithStarsAnalytics,
} from '../Controller/Booking/HostSide/bookingAnalyticsController';
import { getBookingDetails } from '../Controller/Booking/HostSide/bookingDetailsController';
import { searchStories } from '../Controller/Booking/TravellerSide/searchApiController';
import { verifyAccessToken } from '../Middleware/tokenManagement';
import { requireAdminOrHost } from '../Middleware/roleAuth';

const bookingRoutes = Router();

// Apply authentication middleware to all booking routes
bookingRoutes.use(verifyAccessToken);

/**
 * Host APIs
 */

// GET /api/bookings/traveller-bookings - Get traveller's categorized bookings (Past/Upcoming)
bookingRoutes.get('/traveller-bookings', getTravellerBookings);

// POST /api/bookings/analytics/year-round - Get YEAR_ROUND story booking analytics by date
bookingRoutes.post('/analytics/year-round', getYearRoundBookingsByDate);

// POST /api/bookings/analytics/travel-with-stars - Get TRAVEL_WITH_STARS story booking analytics by month
bookingRoutes.post('/analytics/travel-with-stars', getTravelWithStarsAnalytics);

// GET /api/bookings/details/:bookingId - Get booking details summary (Admin/Host only)
bookingRoutes.get('/details/:bookingId', requireAdminOrHost, getBookingDetails);

/**
 * Traveller APIs
 */

// POST /api/bookings/search - Search for stories by location, date, and capacity
bookingRoutes.post('/search', searchStories);

// POST /api/bookings - Create a new booking
bookingRoutes.post('/create-booking', validateBooking, createBooking);

// GET /api/bookings/my-bookings - Get traveller's bookings with simplified details
bookingRoutes.get('/traveller/my-bookings', getTravellerBookingsSimple);

export default bookingRoutes;
