import { Request, Response } from 'express';
import Wishlist from '../../Model/wishlistModel';
import Story from '../../Model/storyModel';

/**
 * POST /api/wishlist/add
 * Add a story to user's wishlist
 */
export const addToWishlist = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).jwtUser?.userId;
    const { storyId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!storyId) {
      res.status(400).json({
        success: false,
        message: 'storyId is required',
      });
      return;
    }

    // Verify story exists and is approved
    const story = await Story.findOne({ storyId, status: 'APPROVED' });
    if (!story) {
      res.status(404).json({
        success: false,
        message: 'Story not found or not available',
      });
      return;
    }

    // Find or create wishlist for user
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      // Create new wishlist
      wishlist = new Wishlist({
        userId,
        items: [{ storyId, addedAt: new Date() }],
      });
      await wishlist.save();

      res.status(201).json({
        success: true,
        message: 'Story added to wishlist',
        data: {
          storyId,
          totalItems: 1,
        },
      });
      return;
    }

    // Check if story already in wishlist
    const existingItem = wishlist.items.find(item => item.storyId === storyId);

    if (existingItem) {
      res.status(400).json({
        success: false,
        message: 'Story already in wishlist',
      });
      return;
    }

    // Add story to existing wishlist
    wishlist.items.push({ storyId, addedAt: new Date() });
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Story added to wishlist',
      data: {
        storyId,
        totalItems: wishlist.items.length,
      },
    });
  } catch (error: any) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * GET /api/wishlist
 * Get user's wishlist with story details
 */
export const getWishlist = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).jwtUser?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist || wishlist.items.length === 0) {
      res.status(200).json({
        success: true,
        message: 'Wishlist is empty',
        data: [],
        total: 0,
      });
      return;
    }

    // Get all story IDs from wishlist
    const storyIds = wishlist.items.map(item => item.storyId);

    // Fetch story details for all wishlist items
    const stories = await Story.find({
      storyId: { $in: storyIds },
      status: 'APPROVED', // Only show approved stories
    }).lean();

    // Map stories with wishlist metadata
    const wishlistItems = wishlist.items
      .map(item => {
        const story = stories.find(s => s.storyId === item.storyId);

        if (!story) {
          return null; // Story might have been deleted or is no longer approved
        }

        // Format price based on pricing type
        let displayAmount = story.amount || 0;
        let formattedAmount = '';

        if (story.pricingType === 'Per Person') {
          formattedAmount = `${displayAmount}/per person`;
        } else if (story.pricingType === 'Per Day') {
          displayAmount = story.totalPrice || story.amount || 0;
          formattedAmount = `${displayAmount}/per day`;
        }

        return {
          storyId: story.storyId,
          storyName: story.storyTitle,
          location: story.location,
          state: story.state,
          bannerImage: story.storyImages?.bannerImage || null,
          price: formattedAmount,
          pricingType: story.pricingType,
          tags: story.tags,
          storyLength: story.storyLength,
          addedAt: item.addedAt,
        };
      })
      .filter(item => item !== null); // Remove null entries (deleted/unapproved stories)

    // Sort by addedAt (most recent first)
    wishlistItems.sort((a, b) => {
      const dateA = a!.addedAt ? new Date(a!.addedAt).getTime() : 0;
      const dateB = b!.addedAt ? new Date(b!.addedAt).getTime() : 0;
      return dateB - dateA;
    });

    res.status(200).json({
      success: true,
      message: 'Wishlist retrieved successfully',
      data: wishlistItems,
      total: wishlistItems.length,
    });
  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * DELETE /api/wishlist/remove
 * Remove a story from user's wishlist
 */
export const removeFromWishlist = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).jwtUser?.userId;
    const { storyId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!storyId) {
      res.status(400).json({
        success: false,
        message: 'storyId is required',
      });
      return;
    }

    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
      return;
    }

    // Check if story exists in wishlist
    const itemIndex = wishlist.items.findIndex(
      item => item.storyId === storyId
    );

    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Story not found in wishlist',
      });
      return;
    }

    // Remove story from wishlist
    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Story removed from wishlist',
      data: {
        storyId,
        remainingItems: wishlist.items.length,
      },
    });
  } catch (error: any) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
