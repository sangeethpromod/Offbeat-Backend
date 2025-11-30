import { Request, Response } from 'express';
import Story, {
  IStory,
  LocationType,
  PricingType,
  StoryImages,
  ImageData,
  ItineraryDay,
} from '../../../Model/storyModel';
import s3Service from '../../../Service/s3Service';

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
    if (role !== 'host') {
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
      tags,
      availabilityType,
      storyLength,
      maxTravelersPerDay,
      startDate,
      endDate,
      maxTravellersScheduled,
    } = req.body as Partial<IStory>;

    // Validate required base fields
    if (
      !storyTitle ||
      !storyDescription ||
      !state ||
      !location ||
      !tags ||
      !availabilityType
    ) {
      res.status(400).json({
        success: false,
        message:
          'Required fields: storyTitle, storyDescription, state, location, tags, availabilityType',
      });
      return;
    }

    // Validate availabilityType
    if (
      availabilityType !== 'YEAR_ROUND' &&
      availabilityType !== 'TRAVEL_WITH_STARS'
    ) {
      res.status(400).json({
        success: false,
        message:
          'availabilityType must be either YEAR_ROUND or TRAVEL_WITH_STARS',
      });
      return;
    }

    // Conditional validation based on availabilityType
    if (availabilityType === 'YEAR_ROUND') {
      if (!storyLength || !maxTravelersPerDay) {
        res.status(400).json({
          success: false,
          message:
            'For YEAR_ROUND availability, storyLength and maxTravelersPerDay are required',
        });
        return;
      }
      if (storyLength < 1) {
        res.status(400).json({
          success: false,
          message: 'storyLength must be at least 1 day',
        });
        return;
      }
      if (maxTravelersPerDay < 1) {
        res.status(400).json({
          success: false,
          message: 'maxTravelersPerDay must be at least 1',
        });
        return;
      }
    } else if (availabilityType === 'TRAVEL_WITH_STARS') {
      if (!startDate || !endDate || !maxTravellersScheduled) {
        res.status(400).json({
          success: false,
          message:
            'For TRAVEL_WITH_STARS availability, startDate, endDate, and maxTravellersScheduled are required',
        });
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        res.status(400).json({
          success: false,
          message: 'startDate must be before endDate',
        });
        return;
      }
      if (maxTravellersScheduled < 1) {
        res.status(400).json({
          success: false,
          message: 'maxTravellersScheduled must be at least 1',
        });
        return;
      }
    }

    // Validate tags
    if (!Array.isArray(tags)) {
      res.status(400).json({
        success: false,
        message: 'Tags must be an array',
      });
      return;
    }

    if (tags.length < 4 || tags.length > 6) {
      res.status(400).json({
        success: false,
        message: 'Tags must contain between 4 and 6 items',
      });
      return;
    }

    // Build story data conditionally based on availabilityType
    const storyData: any = {
      storyTitle,
      storyDescription,
      state,
      location,
      tags,
      availabilityType,
      status: 'STEP 1 COMPLETED',
      createdBy: userId,
    };

    if (availabilityType === 'YEAR_ROUND') {
      storyData.storyLength = storyLength;
      storyData.maxTravelersPerDay = maxTravelersPerDay;
    } else if (availabilityType === 'TRAVEL_WITH_STARS') {
      storyData.startDate = startDate;
      storyData.endDate = endDate;
      storyData.maxTravellersScheduled = maxTravellersScheduled;
    }

    const story = new Story(storyData);

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
        status: 'STEP 2 COMPLETED',
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
        status: 'STEP 3 COMPLETED',
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
      { storyImages, status: 'STEP 4 COMPLETED' },
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

    // Update status to STEP 5 COMPLETED
    await Story.findOneAndUpdate(
      { storyId: id },
      { status: 'STEP 5 COMPLETED' },
      { new: true, runValidators: true }
    );

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

// STEP 7: Publish story (PATCH /api/stories/:id/approve)
export const adminApproveStory = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    // Extract user information from JWT token
    const { email: _email, fullName: _fullName, role } = (req as any).jwtUser;

    // Check if user has Admin role
    if (role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only users with Admin role can approve stories',
      });
      return;
    }

    const { id } = req.params; // storyId

    const updated = await Story.findOneAndUpdate(
      { storyId: id },
      { status: 'APPROVED' },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Story has been approved successfully',
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

// UPDATE: Update basic story information (PUT /api/stories/:id)
export const updateStory = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // storyId
    const { userId, role } = (req as any).jwtUser;

    // Check if user has Host role
    if (role !== 'host') {
      res.status(403).json({
        success: false,
        message: 'Only users with Host role can update stories',
      });
      return;
    }

    const {
      storyTitle,
      storyDescription,
      state,
      location,
      tags,
      availabilityType,
      storyLength,
      maxTravelersPerDay,
      startDate,
      endDate,
      maxTravellersScheduled,
    } = req.body as Partial<IStory>;

    // Check if story exists and belongs to the user
    const existingStory = await Story.findOne({ storyId: id });
    if (!existingStory) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    // Verify ownership
    if (existingStory.createdBy !== userId) {
      res.status(403).json({
        success: false,
        message: 'You can only update your own stories',
      });
      return;
    }

    // Determine the availabilityType to validate against
    const currentAvailabilityType =
      availabilityType || existingStory.availabilityType;

    // Validate availabilityType if provided
    if (availabilityType !== undefined) {
      if (
        availabilityType !== 'YEAR_ROUND' &&
        availabilityType !== 'TRAVEL_WITH_STARS'
      ) {
        res.status(400).json({
          success: false,
          message:
            'availabilityType must be either YEAR_ROUND or TRAVEL_WITH_STARS',
        });
        return;
      }
    }

    // Conditional validation based on availabilityType
    if (currentAvailabilityType === 'YEAR_ROUND') {
      // For YEAR_ROUND, storyLength and maxTravelersPerDay should be provided or already exist
      const finalStoryLength =
        storyLength !== undefined ? storyLength : existingStory.storyLength;
      const finalMaxTravelersPerDay =
        maxTravelersPerDay !== undefined
          ? maxTravelersPerDay
          : existingStory.maxTravelersPerDay;

      if (!finalStoryLength || !finalMaxTravelersPerDay) {
        res.status(400).json({
          success: false,
          message:
            'For YEAR_ROUND availability, storyLength and maxTravelersPerDay are required',
        });
        return;
      }
      if (storyLength !== undefined && storyLength < 1) {
        res.status(400).json({
          success: false,
          message: 'storyLength must be at least 1 day',
        });
        return;
      }
      if (maxTravelersPerDay !== undefined && maxTravelersPerDay < 1) {
        res.status(400).json({
          success: false,
          message: 'maxTravelersPerDay must be at least 1',
        });
        return;
      }
    } else if (currentAvailabilityType === 'TRAVEL_WITH_STARS') {
      // For TRAVEL_WITH_STARS, startDate, endDate, and maxTravellersScheduled should be provided or already exist
      const finalStartDate =
        startDate !== undefined ? startDate : existingStory.startDate;
      const finalEndDate =
        endDate !== undefined ? endDate : existingStory.endDate;
      const finalMaxTravellersScheduled =
        maxTravellersScheduled !== undefined
          ? maxTravellersScheduled
          : existingStory.maxTravellersScheduled;

      if (!finalStartDate || !finalEndDate || !finalMaxTravellersScheduled) {
        res.status(400).json({
          success: false,
          message:
            'For TRAVEL_WITH_STARS availability, startDate, endDate, and maxTravellersScheduled are required',
        });
        return;
      }
      if (startDate !== undefined || endDate !== undefined) {
        const start = startDate
          ? new Date(startDate)
          : new Date(finalStartDate);
        const end = endDate ? new Date(endDate) : new Date(finalEndDate);
        if (start >= end) {
          res.status(400).json({
            success: false,
            message: 'startDate must be before endDate',
          });
          return;
        }
      }
      if (maxTravellersScheduled !== undefined && maxTravellersScheduled < 1) {
        res.status(400).json({
          success: false,
          message: 'maxTravellersScheduled must be at least 1',
        });
        return;
      }
    }

    // Validate tags if provided
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        res.status(400).json({
          success: false,
          message: 'Tags must be an array',
        });
        return;
      }

      if (tags.length < 4 || tags.length > 6) {
        res.status(400).json({
          success: false,
          message: 'Tags must contain between 4 and 6 items',
        });
        return;
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (storyTitle !== undefined) updateData.storyTitle = storyTitle;
    if (storyDescription !== undefined)
      updateData.storyDescription = storyDescription;
    if (state !== undefined) updateData.state = state;
    if (location !== undefined) updateData.location = location;
    if (tags !== undefined) updateData.tags = tags;
    if (availabilityType !== undefined) {
      updateData.availabilityType = availabilityType;
      // Reset conditional fields when changing availability type
      if (availabilityType === 'YEAR_ROUND') {
        updateData.startDate = undefined;
        updateData.endDate = undefined;
        updateData.maxTravellersScheduled = undefined;
      } else if (availabilityType === 'TRAVEL_WITH_STARS') {
        updateData.storyLength = undefined;
        updateData.maxTravelersPerDay = undefined;
      }
    }
    if (storyLength !== undefined) updateData.storyLength = storyLength;
    if (maxTravelersPerDay !== undefined)
      updateData.maxTravelersPerDay = maxTravelersPerDay;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (maxTravellersScheduled !== undefined)
      updateData.maxTravellersScheduled = maxTravellersScheduled;

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
      message: 'Story updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating story:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// DELETE: Delete story (DELETE /api/stories/:id)
export const deleteStory = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // storyId
    const { userId, role } = (req as any).jwtUser;

    // Find the story first
    const story = await Story.findOne({ storyId: id });
    if (!story) {
      res.status(404).json({ success: false, message: 'Story not found' });
      return;
    }

    // Verify ownership (only creator or admin can delete)
    if (story.createdBy !== userId && role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own stories',
      });
      return;
    }

    // Delete images from S3 if they exist
    const imageDeletionPromises: Promise<void>[] = [];

    if (story.storyImages) {
      // Delete banner image
      if (story.storyImages.bannerImage?.key) {
        imageDeletionPromises.push(
          s3Service.deleteFile(story.storyImages.bannerImage.key)
        );
      }

      // Delete story image
      if (story.storyImages.storyImage?.key) {
        imageDeletionPromises.push(
          s3Service.deleteFile(story.storyImages.storyImage.key)
        );
      }

      // Delete other images
      if (
        story.storyImages.otherImages &&
        Array.isArray(story.storyImages.otherImages)
      ) {
        story.storyImages.otherImages.forEach(img => {
          if (img.key) {
            imageDeletionPromises.push(s3Service.deleteFile(img.key));
          }
        });
      }
    }

    // Wait for all S3 deletions to complete
    try {
      await Promise.all(imageDeletionPromises);
      console.log(
        `Successfully deleted ${imageDeletionPromises.length} images from S3 for story ${id}`
      );
    } catch (s3Error) {
      console.error('Error deleting images from S3:', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete the story from database
    await Story.findOneAndDelete({ storyId: id });

    res.status(200).json({
      success: true,
      message: 'Story and associated images deleted successfully',
      data: {
        storyId: id,
        imagesDeleted: imageDeletionPromises.length,
      },
    });
  } catch (error: any) {
    console.error('Error deleting story:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
