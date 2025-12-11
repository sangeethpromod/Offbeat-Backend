import { Request, Response } from 'express';
import Booking from '../../../Model/bookingModel';
import newrelic from 'newrelic';

export const getTravellerBookingsSimple = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = Date.now();

  try {
    // Add route context to New Relic transaction
    newrelic.addCustomAttributes({
      route: 'GET /api/bookings/my-bookings',
      method: 'GET',
      userAgent: req.get('User-Agent') || '',
    });

    const userId = (req as any).jwtUser?.userId;

    if (!userId) {
      newrelic.recordCustomEvent('TravellerBookingsAuthFailure', {
        reason: 'missing_user_id',
        ip: req.ip || 'unknown',
      });
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Track API call start
    newrelic.recordCustomEvent('TravellerBookingsRetrievalStarted', {
      userId,
      requestId: req.headers['x-request-id'] as string,
    });

    // Optimized aggregation pipeline - all data shaping done in MongoDB
    const bookings = await Booking.aggregate([
      // Stage 1: Index-aware match - uses compound index { userId: 1, status: 1, startDate: 1 }
      {
        $match: {
          userId: userId, // userId is stored as string in database
          status: 'confirmed',
        },
      },

      // Stage 2: Optimized lookup with let/match/project for memory efficiency
      {
        $lookup: {
          from: 'stories',
          let: { storyId: '$storyId' },
          pipeline: [
            // Match only the required story
            { $match: { $expr: { $eq: ['$storyId', '$$storyId'] } } },
            // Project only required fields to minimize data transfer
            {
              $project: {
                storyTitle: 1,
                location: 1,
                state: 1,
                _id: 0, // Exclude _id to reduce payload
              },
            },
          ],
          as: 'storyDetails',
        },
      },

      // Stage 3: Unwind story details (should be 1:1 relationship)
      {
        $unwind: {
          path: '$storyDetails',
          preserveNullAndEmptyArrays: false, // Filter out bookings without stories
        },
      },

      // Stage 4: Project and shape all data in MongoDB (no JS processing needed)
      {
        $project: {
          _id: 0, // Exclude MongoDB _id
          bookingId: 1, // Include booking ID
          storyName: '$storyDetails.storyTitle',
          location: '$storyDetails.location',
          state: '$storyDetails.state',
          // Calculate total payment using $sum of grandTotal
          totalprice: {
            $sum: '$paymentDetails.grandTotal',
          },
          // Format dates in MongoDB using $dateToString
          Dates: {
            $concat: [
              // Start day
              {
                $dateToString: {
                  format: '%d',
                  date: '$startDate',
                },
              },
              '-',
              // End day
              {
                $dateToString: {
                  format: '%d',
                  date: '$endDate',
                },
              },
              ' ',
              // Month abbreviation
              {
                $dateToString: {
                  format: '%b',
                  date: '$startDate',
                },
              },
              ' ',
              // Year
              {
                $dateToString: {
                  format: '%Y',
                  date: '$startDate',
                },
              },
            ],
          },
          totalTravellers: '$noOfTravellers',
          bookingStatus: 1, // Include booking status
          startDate: 1, // Include startDate for sorting
          endDate: 1, // Keep endDate for sorting
          // Flag for past or upcoming
          isPast: {
            $lt: ['$endDate', new Date()],
          },
        },
      },

      // Stage 5: Sort by start date (uses index)
      {
        $sort: { startDate: 1 },
      },
    ]);

    // Separate bookings into past and upcoming arrays
    const pastBookings = bookings
      .filter(b => b.isPast)
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      ) // Most recent past first
      .map(({ isPast, endDate, startDate, ...rest }) => rest);

    const upcomingBookings = bookings
      .filter(b => !b.isPast)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ) // Soonest upcoming first
      .map(({ isPast, endDate, startDate, ...rest }) => rest);

    // Track successful database operation
    const queryTime = Date.now() - startTime;
    newrelic.recordCustomEvent('TravellerBookingsDatabaseQuery', {
      userId,
      totalBookingsFound: bookings.length,
      pastBookingsCount: pastBookings.length,
      upcomingBookingsCount: upcomingBookings.length,
      queryTimeMs: queryTime,
      avgQueryTimePerBooking:
        bookings.length > 0 ? queryTime / bookings.length : 0,
    });

    // Track successful retrieval with performance metrics
    newrelic.recordCustomEvent('TravellerBookingsRetrievedSuccessfully', {
      userId,
      totalBookings: bookings.length,
      pastBookings: pastBookings.length,
      upcomingBookings: upcomingBookings.length,
      responseSizeKb:
        JSON.stringify({ pastBookings, upcomingBookings }).length / 1024,
      queryTimeMs: queryTime,
    });

    res.status(200).json({
      success: true,
      message: 'Traveller bookings retrieved successfully',
      data: {
        pastBookings,
        upcomingBookings,
      },
      meta: {
        totalCount: bookings.length,
        pastCount: pastBookings.length,
        upcomingCount: upcomingBookings.length,
        queryTimeMs: queryTime,
      },
    });
  } catch (error: any) {
    const queryTime = Date.now() - startTime;

    // Enhanced error tracking with context
    newrelic.recordCustomEvent('TravellerBookingsRetrievalFailed', {
      userId: (req as any).jwtUser?.userId || 'unknown',
      errorMessage: error.message,
      errorName: error.name,
      queryTimeMs: queryTime,
      stack: error.stack?.substring(0, 500), // Limit stack trace length
    });

    // Proper New Relic error reporting
    newrelic.noticeError(error, {
      route: 'GET /api/bookings/my-bookings',
      userId: (req as any).jwtUser?.userId || 'unknown',
      queryTimeMs: queryTime,
      errorContext: 'traveller_bookings_aggregation',
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve traveller bookings',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
};
