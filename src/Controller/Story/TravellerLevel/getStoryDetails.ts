import { Request, Response } from 'express';
import Story from '../../../Model/storyModel';
import { calculateStoryFees } from '../../../Utils/feeCalculator';

/**
 * GET /api/stories/traveller/details/:storyId
 * Get comprehensive story details for travellers
 */
export const getStoryDetailsForTraveller = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { storyId } = req.params;

    if (!storyId) {
      res.status(400).json({
        success: false,
        message: 'storyId is required',
      });
      return;
    }

    // Fetch the story - only return APPROVED stories for travellers
    const story = await Story.findOne({
      storyId,
      status: 'APPROVED',
    }).lean();

    if (!story) {
      res.status(404).json({
        success: false,
        message: 'Story not found or not available',
      });
      return;
    }

    // Calculate fees for travellers
    const baseAmount = story.amount || 0;
    const { totalFees, feeBreakdown } = await calculateStoryFees(
      baseAmount,
      'TRAVELLER'
    );

    // Build comprehensive response in the requested order
    const storyDetails = {
      // 1. Heading (Story Title)
      heading: story.storyTitle,

      // 2. Description
      description: story.storyDescription,

      // 3. All Images
      images: {
        bannerImage: story.storyImages?.bannerImage || null,
        storyImage: story.storyImages?.storyImage || null,
        otherImages: story.storyImages?.otherImages || [],
      },

      // 4. Itinerary
      itinerary: story.itinerary || [],

      // 5. Story Amount and Pricing Details
      pricing: {
        pricingType: story.pricingType,
        baseAmount: story.amount,
        discount: story.discount || 0,
        totalPrice: story.totalPrice,
        priceBreakdown: story.priceBreakdown || [],
      },

      // 6. Related Fees
      fees: {
        totalFees,
        feeBreakdown,
        grandTotal: (story.totalPrice || 0) + totalFees,
      },

      // Additional useful information
      metadata: {
        storyId: story.storyId,
        location: story.location,
        state: story.state,
        locationDetails: story.locationDetails,
        tags: story.tags,
        storyLength: story.storyLength,
        availabilityType: story.availabilityType,
        ...(story.availabilityType === 'YEAR_ROUND'
          ? { maxTravelersPerDay: story.maxTravelersPerDay }
          : {
              startDate: story.startDate,
              endDate: story.endDate,
              maxTravellersScheduled: story.maxTravellersScheduled,
            }),
        locationType: story.locationType,
        pickupLocation: story.pickupLocation,
        pickupGoogleMapLink: story.pickupGoogleMapLink,
        dropOffLocation: story.dropOffLocation,
        dropOffGoogleMapLink: story.dropOffGoogleMapLink,
        pickUpTime: story.pickUpTime,
        dropOffTime: story.dropOffTime,
        hostName: story.hostName,
        hostDescription: story.hostDescription,
      },
    };

    res.status(200).json({
      success: true,
      message: 'Story details retrieved successfully',
      data: storyDetails,
    });
  } catch (error: any) {
    console.error('Error fetching story details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
