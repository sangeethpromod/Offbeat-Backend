import { Request, Response } from 'express';
import Story from '../../../Model/storyModel';

/**
 * GET /api/stories/my-stories - Get all stories created by the authenticated user
 */
export const getStoriesByUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract user information from JWT token
    const { userId } = (req as any).jwtUser;
    console.log('Fetching stories for userId:', userId);

    // Find all stories created by this user
    const stories = await Story.find({ createdBy: userId })
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .select('-__v'); // Exclude version field

    res.status(200).json({
      success: true,
      message: 'Stories retrieved successfully',
      data: {
        stories,
        count: stories.length,
      },
    });
  } catch (error: any) {
    console.error('Error retrieving user stories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
