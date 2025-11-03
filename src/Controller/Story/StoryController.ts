import { Request, Response } from 'express';
import Story, {
  IStory,
  LocationType,
  PricingType,
} from '../../Model/storyModel';

// Helpers
const calculateNoOfDays = (start: Date, end: Date): number => {
  const startTime = new Date(start).setHours(0, 0, 0, 0);
  const endTime = new Date(end).setHours(0, 0, 0, 0);
  if (endTime < startTime) {
    throw new Error('endDate must be greater than or equal to startDate');
  }
  const msInDay = 24 * 60 * 60 * 1000;
  const diff = Math.round((endTime - startTime) / msInDay);
  return Math.max(1, diff || 1);
};

// STEP 1: Create story (POST /api/stories)
export const createStory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      storyTitle,
      storyDescription,
      state,
      location,
      startDate,
      endDate,
      maxTravelersPerDay,
    } = req.body as Partial<IStory>;

    // Validate required fields
    if (
      !storyTitle ||
      !storyDescription ||
      !state ||
      !location ||
      !startDate ||
      !endDate ||
      !maxTravelersPerDay
    ) {
      res.status(400).json({
        success: false,
        message:
          'Required fields: storyTitle, storyDescription, state, location, startDate, endDate, maxTravelersPerDay',
      });
      return;
    }

    // Validate date order and calculate number of days
    let noOfDays: number;
    try {
      noOfDays = calculateNoOfDays(new Date(startDate), new Date(endDate));
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
      return;
    }

    const story = new Story({
      storyTitle,
      storyDescription,
      state,
      location,
      startDate,
      endDate,
      noOfDays,
      maxTravelersPerDay,
      status: 'DRAFT',
    });

    const created = await story.save();
    res.status(201).json({
      success: true,
      message: 'Story created',
      data: created,
      storyId: created.storyId,
    });
  } catch (error: any) {
    console.error('Error creating story:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// STEP 2: Update story page 2 (PATCH /api/stories/:id/page2)
export const updateStoryPage2 = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // storyId
    const {
      locationType,
      pickupLocation,
      pickupGoogleMapLink,
      dropOffLocation,
      dropOffGoogleMapLink,
      hostName,
      hostDescription,
    } = req.body as Partial<IStory> & { locationType?: LocationType };

    if (!locationType || !hostName || !hostDescription) {
      res.status(400).json({
        success: false,
        message: 'Required fields: locationType, hostName, hostDescription',
      });
      return;
    }

    // Dynamic validations based on locationType
    const errors: string[] = [];
    switch (locationType) {
      case 'Pickup and Dropoff': {
        if (!pickupLocation || !pickupGoogleMapLink)
          errors.push('pickupLocation and pickupGoogleMapLink are required');
        if (!dropOffLocation || !dropOffGoogleMapLink)
          errors.push('dropOffLocation and dropOffGoogleMapLink are required');
        break;
      }
      case 'Pickup Only': {
        if (!pickupLocation || !pickupGoogleMapLink)
          errors.push('pickupLocation and pickupGoogleMapLink are required');
        break;
      }
      case 'Drop Only': {
        if (!dropOffLocation || !dropOffGoogleMapLink)
          errors.push('dropOffLocation and dropOffGoogleMapLink are required');
        break;
      }
      case 'None':
        // no extra fields required
        break;
      default:
        errors.push('Invalid locationType');
    }

    if (errors.length) {
      res.status(400).json({ success: false, message: errors.join('; ') });
      return;
    }

    const updated = await Story.findOneAndUpdate(
      { storyId: id },
      {
        locationType,
        pickupLocation: pickupLocation || undefined,
        pickupGoogleMapLink: pickupGoogleMapLink || undefined,
        dropOffLocation: dropOffLocation || undefined,
        dropOffGoogleMapLink: dropOffGoogleMapLink || undefined,
        hostName,
        hostDescription,
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Story updated (page 2)',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating story page 2:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// STEP 3: Update story page 3 (PATCH /api/stories/:id/page3)
export const updateStoryPage3 = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // storyId
    const { pricingType, amount, discount } = req.body as {
      pricingType?: PricingType;
      amount?: number;
      discount?: number;
    };

    if (!pricingType || amount === undefined || amount === null) {
      res.status(400).json({
        success: false,
        message: 'Required fields: pricingType, amount',
      });
      return;
    }

    const platformFee = 50;
    const appliedDiscount = Math.max(0, Number(discount) || 0);
    const base = Math.max(0, Number(amount));
    const totalBeforeFee = Math.max(0, base - appliedDiscount);
    const totalPrice = totalBeforeFee + platformFee;

    const priceBreakdown = [
      { label: 'Base Price', value: base },
      { label: 'Discount', value: appliedDiscount },
      { label: 'Platform Fee', value: platformFee },
      { label: 'Total Price', value: totalPrice },
    ];

    const updated = await Story.findOneAndUpdate(
      { storyId: id },
      {
        pricingType,
        amount: base,
        discount: appliedDiscount,
        platformFee,
        totalPrice,
        priceBreakdown,
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Booking updated (page 3)',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating booking page 3:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
