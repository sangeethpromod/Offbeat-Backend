import { Request, Response } from 'express';
import Booking from '../../../Model/bookingModel';
import newrelic from 'newrelic';

/**
 * Get user's bookings categorized into Past and Upcoming
 */
export const getTravellerBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).jwtUser?.userId;
    const role = (req as any).jwtUser?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Check if user has Traveller role
    if (role !== 'host') {
      res.status(403).json({
        success: false,
        message: 'Only users with Host role can access their bookings',
      });
      return;
    }

    // Track API call
    newrelic.recordCustomEvent('UserBookingsRetrievalStarted', {
      userId,
    });

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    // Query bookings with story details using aggregation
    const bookings = await Booking.aggregate([
      {
        $match: {
          userId,
          status: 'confirmed',
        },
      },
      {
        $lookup: {
          from: 'stories', // MongoDB collection name for Story model
          localField: 'storyId',
          foreignField: 'storyId',
          as: 'storyDetails',
        },
      },
      {
        $unwind: {
          path: '$storyDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          totalTravellers: '$noOfTravellers', // Ensure totalTravellers is available
        },
      },
      {
        $sort: { startDate: 1 },
      },
    ]);

    // Track database operation
    newrelic.recordCustomEvent('UserBookingsDatabaseQuery', {
      userId,
      totalBookingsFound: bookings.length,
    });

    // Categorize bookings
    const categorizedBookings = {
      upcoming: [] as any[],
      past: [] as any[],
    };

    bookings.forEach(booking => {
      const bookingData = {
        bookingId: booking.bookingId,
        storyId: booking.storyId,
        storyName: booking.storyDetails?.storyTitle,
        storylocation: booking.storyDetails?.location,
        storyState: booking.storyDetails?.state,
        Dates: {
          startDate: booking.startDate,
          endDate: booking.endDate,
        },
        totalNoOfTravellers: booking.totalTravellers,
      };

      // Check if booking is upcoming or past
      // A booking is considered "upcoming" if its endDate is today or in the future
      // A booking is considered "past" if its endDate is before today
      if (booking.endDate >= currentDate) {
        categorizedBookings.upcoming.push(bookingData);
      } else {
        categorizedBookings.past.push(bookingData);
      }
    });

    // Track successful retrieval
    newrelic.recordCustomEvent('UserBookingsRetrievedSuccessfully', {
      userId,
      upcomingCount: categorizedBookings.upcoming.length,
      pastCount: categorizedBookings.past.length,
      totalBookings: bookings.length,
    });

    res.status(200).json({
      success: true,
      message: 'User bookings retrieved successfully',
      data: categorizedBookings,
    });
  } catch (error: any) {
    // Track error
    newrelic.recordCustomEvent('UserBookingsRetrievalFailed', {
      userId: (req as any).jwtUser?.userId,
      errorMessage: error.message,
    });
    newrelic.noticeError(error, {
      userId: (req as any).jwtUser?.userId,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user bookings',
      error: error.message,
    });
  }
};
