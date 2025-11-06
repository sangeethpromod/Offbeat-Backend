import { Request, Response } from 'express';
import Story, {
  IStory,
  LocationType,
  PricingType,
  StoryImages,
  ImageData,
  ItineraryDay,
} from '../../Model/storyModel';
import s3Service from '../../Service/s3Service';

// STEP 1: Create story (POST /api/stories)
export const createStory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract user information from JWT token
    // You can now access: userId, email, fullName from the authenticated user
    const {
      userId,
      email: _email,
      fullName: _fullName,
      role,
    } = (req as any).jwtUser;

    // Check if user has Host role
    if (role !== 'Host') {
      res.status(403).json({
        success: false,
        message: 'Only users with Host role can create stories',
      });
      return;
    }

    const {
      storyTitle,
      storyDescription,
      state,
      location,
      storyLength,
      maxTravelersPerDay,
    } = req.body as Partial<IStory>;

    // Validate required fields
    if (
      !storyTitle ||
      !storyDescription ||
      !state ||
      !location ||
      !storyLength ||
      !maxTravelersPerDay
    ) {
      res.status(400).json({
        success: false,
        message:
          'Required fields: storyTitle, storyDescription, state, location, storyLength, maxTravelersPerDay',
      });
      return;
    }

    // Validate storyLength
    if (storyLength < 1) {
      res.status(400).json({
        success: false,
        message: 'storyLength must be at least 1 day',
      });
      return;
    }

    const story = new Story({
      storyTitle,
      storyDescription,
      state,
      location,
      storyLength,
      maxTravelersPerDay,
      status: 'DRAFT',
      createdBy: userId, // Added: Set createdBy to the authenticated user's ID
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

// STEP 4: Update story images (PATCH /api/stories/:id/images)
export const updateStoryImages = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // storyId

    // Check if story exists
    const existingStory = await Story.findOne({ storyId: id });
    if (!existingStory) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const storyImages: StoryImages = {};

    // Upload banner image
    if (files.bannerImage && files.bannerImage.length > 0) {
      const bannerFile = files.bannerImage[0];
      if (bannerFile) {
        const bannerUrl = await s3Service.uploadFile(
          bannerFile,
          `stories/${id}/banner`
        );
        const bannerKey = bannerUrl.split('/').slice(3).join('/');
        storyImages.bannerImage = {
          key: bannerKey,
          url: bannerUrl,
        };
      }
    }

    // Upload story image
    if (files.storyImage && files.storyImage.length > 0) {
      const storyFile = files.storyImage[0];
      if (storyFile) {
        const storyUrl = await s3Service.uploadFile(
          storyFile,
          `stories/${id}/main`
        );
        const storyKey = storyUrl.split('/').slice(3).join('/');
        storyImages.storyImage = {
          key: storyKey,
          url: storyUrl,
        };
      }
    }

    // Upload other images
    if (files.otherImages && files.otherImages.length > 0) {
      const otherImages: ImageData[] = [];
      for (const file of files.otherImages) {
        if (file) {
          const otherUrl = await s3Service.uploadFile(
            file,
            `stories/${id}/others`
          );
          const otherKey = otherUrl.split('/').slice(3).join('/');
          otherImages.push({
            key: otherKey,
            url: otherUrl,
          });
        }
      }
      storyImages.otherImages = otherImages;
    }

    // Update the story with the new images
    const updated = await Story.findOneAndUpdate(
      { storyId: id },
      { storyImages },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Story images updated',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating story images:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// STEP 5: Update story itinerary (PATCH /api/stories/:id/itinerary)
export const updateStoryItinerary = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // storyId
    const { pickUpTime, dropOffTime, itinerary } = req.body as {
      pickUpTime?: string;
      dropOffTime?: string;
      itinerary?: ItineraryDay[];
    };

    // Check if story exists
    const existingStory = await Story.findOne({ storyId: id });
    if (!existingStory) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    // Prepare update object
    const updateData: Partial<IStory> = {};

    if (pickUpTime !== undefined) {
      updateData.pickUpTime = new Date(pickUpTime);
    }

    if (dropOffTime !== undefined) {
      updateData.dropOffTime = new Date(dropOffTime);
    }

    if (itinerary !== undefined) {
      // Basic validation for itinerary
      if (!Array.isArray(itinerary)) {
        res.status(400).json({
          success: false,
          message: 'Itinerary must be an array',
        });
        return;
      }

      // Validate each day
      for (const day of itinerary) {
        if (typeof day.day !== 'number' || day.day < 1) {
          res.status(400).json({
            success: false,
            message:
              'Each itinerary day must have a valid day number (minimum 1)',
          });
          return;
        }

        if (!Array.isArray(day.activities)) {
          res.status(400).json({
            success: false,
            message: 'Each day must have an activities array',
          });
          return;
        }

        // Validate activities
        for (const activity of day.activities) {
          if (!activity.type || !activity.activityName) {
            res.status(400).json({
              success: false,
              message: 'Each activity must have type and activityName',
            });
            return;
          }
        }
      }

      updateData.itinerary = itinerary;
    }

    // Update the story
    const updated = await Story.findOneAndUpdate({ storyId: id }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Story itinerary updated',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating story itinerary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// STEP 6: Publish story (PATCH /api/stories/:id/publish)
export const publishStory = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // storyId

    const updated = await Story.findOneAndUpdate(
      { storyId: id },
      { status: 'PUBLISHED' },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Story published successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error publishing story:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
