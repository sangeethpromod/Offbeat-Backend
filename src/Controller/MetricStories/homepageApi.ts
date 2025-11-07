import { Request, Response } from 'express';
import Story from '../../Model/storyModel';
import Booking from '../../Model/bookingModel';

/**
 * Get top 20 recently posted stories
 * Returns: storyName, storyId, location, state, formatted base price, storyImage URL
 */
export const getRecentStories = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch top 20 stories sorted by creation date (most recent first)
    // Only include APPROVED stories
    const stories = await Story.find({ status: 'APPROVED' })
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        'storyId storyTitle location state amount pricingType storyImages createdAt'
      )
      .lean();

    // Format the response
    const formattedStories = stories.map(story => {
      // Format base price based on pricingType
      let formattedPrice = '';
      if (story.amount !== undefined && story.pricingType) {
        if (story.pricingType === 'Per Day') {
          formattedPrice = `₹${story.amount}/day`;
        } else if (story.pricingType === 'Per Person') {
          formattedPrice = `₹${story.amount} for 1 person`;
        }
      }

      return {
        storyName: story.storyTitle,
        storyId: story.storyId,
        location: story.location,
        state: story.state,
        basePrice: formattedPrice,
        storyImageUrl: story.storyImages?.storyImage?.url || null,
        createdAt: story.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Top 20 recent stories retrieved successfully',
      count: formattedStories.length,
      data: formattedStories,
    });
  } catch (error: any) {
    console.error('Error fetching recent stories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Get top 20 most booked stories
 * Returns: storyName, storyId, location, state, formatted base price, storyImage URL, booking count
 */
export const getMostBookedStories = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Aggregate bookings to count by storyId (only confirmed bookings)
    const bookingStats = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: '$storyId',
          bookingCount: { $sum: 1 },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 20 },
    ]);

    // Extract storyIds
    const storyIds = bookingStats.map(stat => stat._id);

    // Fetch story details for these storyIds
    const stories = await Story.find({
      storyId: { $in: storyIds },
      status: 'APPROVED',
    })
      .select(
        'storyId storyTitle location state amount pricingType storyImages'
      )
      .lean();

    // Format the response and maintain the sort order
    const formattedStories = bookingStats
      .map(stat => {
        const story = stories.find(s => s.storyId === stat._id);
        if (!story) return null;

        // Format base price based on pricingType
        let formattedPrice = '';
        if (story.amount !== undefined && story.pricingType) {
          if (story.pricingType === 'Per Day') {
            formattedPrice = `₹${story.amount}/day`;
          } else if (story.pricingType === 'Per Person') {
            formattedPrice = `₹${story.amount} for 1 person`;
          }
        }

        return {
          storyName: story.storyTitle,
          storyId: story.storyId,
          location: story.location,
          state: story.state,
          basePrice: formattedPrice,
          storyImageUrl: story.storyImages?.storyImage?.url || null,
          bookingCount: stat.bookingCount,
        };
      })
      .filter(story => story !== null);

    res.status(200).json({
      success: true,
      message: 'Top 20 most booked stories retrieved successfully',
      count: formattedStories.length,
      data: formattedStories,
    });
  } catch (error: any) {
    console.error('Error fetching most booked stories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
