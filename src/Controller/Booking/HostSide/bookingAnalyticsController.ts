import { Request, Response } from 'express';
import Booking from '../../../Model/bookingModel';
import Story from '../../../Model/storyModel';
import newrelic from 'newrelic';

export interface GetBookingsByDateRequest {
  date: string; // ISO date string
}

/**
 * Get booking analytics for a specific date
 */
export const getBookingsByDate = async (
  req: Request<{}, {}, GetBookingsByDateRequest>,
  res: Response
): Promise<void> => {
  try {
    const { date } = req.body;

    if (!date) {
      res.status(400).json({
        success: false,
        message: 'Date is required',
      });
      return;
    }

    const queryDate = new Date(date);

    // Log the analytics request
    newrelic.recordCustomEvent('BookingAnalyticsRequested', {
      requestedDate: date,
      userId: (req as any).user?.id,
    });

    // Find all published stories
    const publishedStories = await Story.find({ status: 'PUBLISHED' })
      .select('storyId storyTitle storyLength maxTravelersPerDay')
      .lean();

    let totalActiveStories = 0;
    let totalTravellers = 0;
    let totalSpace = 0;
    const storiesData: any[] = [];

    // Process each published story
    for (const story of publishedStories) {
      // Find bookings for this story that overlap with the query date
      const overlappingBookings = await Booking.find({
        storyId: story._id,
        status: 'confirmed',
        startDate: { $lte: queryDate },
        endDate: { $gte: queryDate },
      })
        .select('bookingId startDate endDate noOfTravellers')
        .lean();

      // If there are bookings for this story on this date, it's active
      if (overlappingBookings.length > 0) {
        totalActiveStories++;
        totalSpace += story.maxTravelersPerDay;

        // Calculate total travellers for this story on this date
        const storyTravellers = overlappingBookings.reduce(
          (sum, booking) => sum + booking.noOfTravellers,
          0
        );
        totalTravellers += storyTravellers;

        // Process bookings with itinerary day calculation
        const bookingsWithItinerary = overlappingBookings.map(booking => {
          // Calculate which day of the story this booking is on
          const daysIntoStory =
            Math.floor(
              (queryDate.getTime() - booking.startDate.getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1; // +1 because day 1 is the first day

          return {
            bookingId: booking.bookingId,
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalNoOfTravellers: booking.noOfTravellers,
            itineraryDay: daysIntoStory,
          };
        });

        storiesData.push({
          storyId: story.storyId,
          title: story.storyTitle,
          maxTravelersPerDay: story.maxTravelersPerDay,
          storyLength: story.storyLength,
          bookings: bookingsWithItinerary,
        });
      }
    }

    const spaceLeft = totalSpace - totalTravellers;

    // Log successful analytics response
    newrelic.recordCustomEvent('BookingAnalyticsCompleted', {
      requestedDate: date,
      userId: (req as any).user?.id,
      activeStories: totalActiveStories,
      totalTravellers,
      totalSpace,
      spaceLeft,
    });

    res.status(200).json({
      success: true,
      message: 'Booking analytics retrieved successfully',
      data: {
        date: queryDate.toISOString().split('T')[0], // Return date in YYYY-MM-DD format
        activeStories: totalActiveStories,
        totalTravellers,
        totalSpace,
        spaceLeft,
        stories: storiesData,
      },
    });
  } catch (error: any) {
    // Log analytics error
    newrelic.recordCustomEvent('BookingAnalyticsFailed', {
      requestedDate: req.body.date,
      userId: (req as any).user?.id,
      errorMessage: error.message,
    });
    newrelic.noticeError(error, {
      requestedDate: req.body.date,
      userId: (req as any).user?.id,
    });

    console.error('Booking analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking analytics',
      error: error.message,
    });
  }
};
