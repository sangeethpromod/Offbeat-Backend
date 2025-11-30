import { Request, Response } from 'express';
import Booking from '../../../Model/bookingModel';
import Story from '../../../Model/storyModel';

export interface GetBookingsByDateRequest {
  date: string; // ISO date string
}

export interface GetTravelWithStarsAnalyticsRequest {
  month: string; // MM format (01-12)
}

interface StoryDateRange {
  storyId: string;
  range: string[];
}

interface TravelStarBooking {
  bookingId: string;
  startDate: Date;
  endDate: Date;
  totalNoOfTravellers: number;
  itineraryDay: number;
}

interface TravelStarStory {
  storyId: string;
  title: string;
  maxTravelers: number;
  dateRange: string[];
  bookings: TravelStarBooking[];
}

/**
 * Get booking analytics for YEAR_ROUND stories by specific date
 */
export const getYearRoundBookingsByDate = async (
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

    console.log('Fetching YEAR_ROUND booking analytics for date:', date);

    // Find all approved YEAR_ROUND stories
    const approvedStories = await Story.find({
      status: 'APPROVED',
      availabilityType: 'YEAR_ROUND',
    })
      .select('storyId storyTitle storyLength maxTravelersPerDay')
      .lean();

    let totalActiveStories = 0;
    let totalTravellers = 0;
    let totalSpace = 0;
    const storiesData: any[] = [];

    // Process each approved story
    for (const story of approvedStories) {
      // Find bookings for this story that overlap with the query date
      const overlappingBookings = await Booking.find({
        storyId: story.storyId,
        status: 'confirmed',
        startDate: { $lte: queryDate },
        endDate: { $gte: queryDate },
      })
        .select('bookingId startDate endDate noOfTravellers')
        .lean();

      // If there are bookings for this story on this date, it's active
      if (overlappingBookings.length > 0) {
        totalActiveStories++;
        const maxCapacity = story.maxTravelersPerDay || 0;
        totalSpace += maxCapacity;

        // Calculate total travellers for this story on this date
        const storyTravellers = overlappingBookings.reduce(
          (sum, booking) => sum + booking.noOfTravellers,
          0
        );
        totalTravellers += storyTravellers;

        // Process bookings with itinerary day calculation
        const bookingsWithItinerary = overlappingBookings.map(booking => {
          const daysIntoStory =
            Math.floor(
              (queryDate.getTime() - booking.startDate.getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1;

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

    console.log('YEAR_ROUND analytics computed:', {
      activeStories: totalActiveStories,
      totalTravellers,
      totalSpace,
      spaceLeft,
    });

    res.status(200).json({
      success: true,
      message: 'YEAR_ROUND booking analytics retrieved successfully',
      data: {
        date: queryDate.toISOString().split('T')[0],
        activeStories: totalActiveStories,
        totalTravellers,
        totalSpace,
        spaceLeft,
        stories: storiesData,
      },
    });
  } catch (error: any) {
    console.error('YEAR_ROUND booking analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve YEAR_ROUND booking analytics',
      error: error.message,
    });
  }
};






/**
 * Get booking analytics for TRAVEL_WITH_STARS stories by month
 */
export const getTravelWithStarsAnalytics = async (
  req: Request<{}, {}, GetTravelWithStarsAnalyticsRequest>,
  res: Response
): Promise<void> => {
  try {
    const { month } = req.body;

    if (!month || month.length !== 2 || isNaN(parseInt(month))) {
      res.status(400).json({
        success: false,
        message: 'Month is required and must be in MM format (01-12)',
      });
      return;
    }

    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > 12) {
      res.status(400).json({
        success: false,
        message: 'Month must be between 01 and 12',
      });
      return;
    }

    console.log('Fetching TRAVEL_WITH_STARS analytics for month:', month);

    // Get current year (can be made dynamic if needed)
    const currentYear = new Date().getFullYear();
    const startOfMonth = new Date(currentYear, monthNum - 1, 1);
    const endOfMonth = new Date(currentYear, monthNum, 0, 23, 59, 59);

    // Find all approved TRAVEL_WITH_STARS stories that have bookings in this month
    const approvedStories = await Story.find({
      status: 'APPROVED',
      availabilityType: 'TRAVEL_WITH_STARS',
    })
      .select('storyId storyTitle startDate endDate maxTravellersScheduled')
      .lean();

    let totalActiveStories = 0;
    let totalTravellers = 0;
    let totalSpace = 0;
    const storiesData: TravelStarStory[] = [];
    const storyDateRanges: StoryDateRange[] = [];

    // Process each approved story
    for (const story of approvedStories) {
      if (!story.startDate || !story.endDate) {
        continue;
      }

      // Check if story's date range overlaps with the month
      const storyStart = new Date(story.startDate);
      const storyEnd = new Date(story.endDate);

      if (storyEnd < startOfMonth || storyStart > endOfMonth) {
        // Story doesn't overlap with this month
        continue;
      }

      // Find the overlap period within the month
      const overlapStart =
        storyStart > startOfMonth ? storyStart : startOfMonth;
      const overlapEnd = storyEnd < endOfMonth ? storyEnd : endOfMonth;

      // Find bookings for this story within the month
      const bookingsInMonth = await Booking.find({
        storyId: story.storyId,
        status: 'confirmed',
        startDate: { $lte: overlapEnd },
        endDate: { $gte: overlapStart },
      })
        .select('bookingId startDate endDate noOfTravellers')
        .lean();

      if (bookingsInMonth.length > 0) {
        totalActiveStories++;
        const maxCapacity = story.maxTravellersScheduled || 0;
        totalSpace += maxCapacity;

        // Calculate total travellers for this story in the month
        const storyTravellers = bookingsInMonth.reduce(
          (sum, booking) => sum + booking.noOfTravellers,
          0
        );
        totalTravellers += storyTravellers;

        // Format date range for this story
        const startDateStr = overlapStart.toISOString().split('T')[0] || '';
        const endDateStr = overlapEnd.toISOString().split('T')[0] || '';
        const dateRange: string[] = [startDateStr, endDateStr];

        // Add to storyDateRanges array
        storyDateRanges.push({
          storyId: story.storyId,
          range: dateRange,
        });

        // Process bookings
        const bookingsWithItinerary = bookingsInMonth.map(booking => {
          const bookingStart = new Date(booking.startDate);
          const daysIntoStory =
            Math.floor(
              (bookingStart.getTime() - storyStart.getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1;

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
          maxTravelers: maxCapacity,
          dateRange,
          bookings: bookingsWithItinerary,
        });
      }
    }

    const spaceLeft = totalSpace - totalTravellers;

    console.log('TRAVEL_WITH_STARS analytics computed:', {
      month,
      activeStories: totalActiveStories,
      totalTravellers,
      totalSpace,
      spaceLeft,
    });

    res.status(200).json({
      success: true,
      message: 'TRAVEL_WITH_STARS booking analytics retrieved successfully',
      data: {
        month,
        activeStories: totalActiveStories,
        totalTravellers,
        totalSpace,
        spaceLeft,
        storyDates: storyDateRanges,
        stories: storiesData,
      },
    });
  } catch (error: any) {
    console.error('TRAVEL_WITH_STARS analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve TRAVEL_WITH_STARS analytics',
      error: error.message,
    });
  }
};
