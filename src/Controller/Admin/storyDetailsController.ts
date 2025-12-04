import { Request, Response } from 'express';
import Story from '../../Model/storyModel';
import AuthUser from '../../Model/authModel';

/**
 * GET /api/admin/stories/:storyId
 * Get detailed story information by storyId (Admin only)
 */
export const getStoryDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { role } = (req as any).jwtUser;

    // Check if user has Admin role
    if (role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only users with Admin role can view story details',
      });
      return;
    }

    const { storyId } = req.params;

    if (!storyId) {
      res.status(400).json({
        success: false,
        message: 'Story ID is required',
      });
      return;
    }

    // Find the story
    const story = await Story.findOne({ storyId });

    if (!story) {
      res.status(404).json({
        success: false,
        message: 'Story not found',
      });
      return;
    }

    // Get creator information
    const creator = await AuthUser.findOne({ userId: story.createdBy });

    // Format pickup and dropoff times
    const formatTime = (date?: Date) => {
      if (!date) return null;
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    // Build response object
    const response = {
      success: true,
      data: {
        // Basic Information
        storyId: story.storyId,
        storyTitle: story.storyTitle,
        status: story.status,
        blockReason: story.blockReason || null,

        // Creator Information
        createdBy: {
          userId: story.createdBy,
          fullName: creator?.fullName || 'Unknown',
          email: creator?.email || 'N/A',
        },
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,

        // Core Story Information
        storyDescription: story.storyDescription,
        state: story.state,
        location: story.location,
        locationDetails: story.locationDetails || null,
        availabilityType: story.availabilityType,
        tags: story.tags,

        // Availability Details
        availabilityDetails: {
          // For YEAR_ROUND
          storyLength: story.storyLength || null,
          maxTravelersPerDay: story.maxTravelersPerDay || null,
          // For TRAVEL_WITH_STARS
          startDate: story.startDate || null,
          endDate: story.endDate || null,
          maxTravellersScheduled: story.maxTravellersScheduled || null,
        },

        // Host & Pickup/Dropoff Details
        hostDetails: {
          locationType: story.locationType || null,
          pickupLocation: story.pickupLocation || null,
          pickupGoogleMapLink: story.pickupGoogleMapLink || null,
          dropOffLocation: story.dropOffLocation || null,
          dropOffGoogleMapLink: story.dropOffGoogleMapLink || null,
          hostName: story.hostName || null,
          hostDescription: story.hostDescription || null,
        },

        // Pricing Details
        pricingDetails: {
          pricingType: story.pricingType || null,
          amount: story.amount || 0,
          discount: story.discount || 0,
          platformFee: story.platformFee || 0,
          totalPrice: story.totalPrice || 0,
          priceBreakdown: story.priceBreakdown || [],
        },

        // Images
        storyImages: {
          bannerImage: story.storyImages?.bannerImage || null,
          storyImage: story.storyImages?.storyImage || null,
          otherImages: story.storyImages?.otherImages || [],
        },

        // Pickup & Drop Timing
        timing: {
          pickUpTime: story.pickUpTime ? formatTime(story.pickUpTime) : null,
          dropOffTime: story.dropOffTime ? formatTime(story.dropOffTime) : null,
          pickUpTimeRaw: story.pickUpTime || null,
          dropOffTimeRaw: story.dropOffTime || null,
        },

        // Itinerary
        itinerary: story.itinerary || [],
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error fetching story details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
