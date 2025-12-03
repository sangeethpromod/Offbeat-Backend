import { Request, Response } from 'express';
import Story from '../../Model/storyModel';

interface BlockStoryRequest {
  storyId: string;
  blockReason: string;
}

interface UnblockStoryRequest {
  storyId: string;
}

/**
 * Block a story - Change status to BLOCKED with a reason
 */
export const blockStory = async (
  req: Request<{}, {}, BlockStoryRequest>,
  res: Response
): Promise<void> => {
  try {
    const { storyId, blockReason } = req.body;

    if (!storyId) {
      res.status(400).json({
        success: false,
        message: 'storyId is required',
      });
      return;
    }

    if (!blockReason || blockReason.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'blockReason is required',
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

    // Check if story is already blocked
    if (story.status === 'BLOCKED') {
      res.status(400).json({
        success: false,
        message: 'Story is already blocked',
        data: {
          blockReason: story.blockReason,
        },
      });
      return;
    }

    // Update status to BLOCKED and save reason
    story.status = 'BLOCKED';
    story.blockReason = blockReason.trim();
    await story.save();

    console.log(`Story ${storyId} blocked by admin. Reason: ${blockReason}`);

    res.status(200).json({
      success: true,
      message: 'Story blocked successfully',
      data: {
        storyId: story.storyId,
        storyTitle: story.storyTitle,
        createdBy: story.createdBy,
        status: story.status,
        blockReason: story.blockReason,
        blockedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error blocking story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block story',
      error: error.message,
    });
  }
};

/**
 * Unblock a story - Change status from BLOCKED back to APPROVED
 */
export const unblockStory = async (
  req: Request<{}, {}, UnblockStoryRequest>,
  res: Response
): Promise<void> => {
  try {
    const { storyId } = req.body;

    if (!storyId) {
      res.status(400).json({
        success: false,
        message: 'storyId is required',
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

    // Check if story is actually blocked
    if (story.status !== 'BLOCKED') {
      res.status(400).json({
        success: false,
        message: 'Story is not blocked',
        data: {
          currentStatus: story.status,
        },
      });
      return;
    }

    // Update status to APPROVED and clear block reason
    const previousBlockReason = story.blockReason;
    story.status = 'APPROVED';
    story.blockReason = null;
    await story.save();

    console.log(`Story ${storyId} unblocked by admin`);

    res.status(200).json({
      success: true,
      message: 'Story unblocked successfully',
      data: {
        storyId: story.storyId,
        storyTitle: story.storyTitle,
        createdBy: story.createdBy,
        status: story.status,
        previousBlockReason,
        unblockedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error unblocking story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock story',
      error: error.message,
    });
  }
};
