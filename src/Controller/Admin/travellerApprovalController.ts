import { Request, Response } from 'express';
import AuthUser from '../../Model/authModel';

interface BlockTravellerRequest {
  userId: string;
  blockReason: string;
}

interface UnblockTravellerRequest {
  userId: string;
}

/**
 * Block a traveller - Set isActive to false
 */
export const blockTraveller = async (
  req: Request<{}, {}, BlockTravellerRequest>,
  res: Response
): Promise<void> => {
  try {
    const { userId, blockReason } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'userId is required',
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

    // Find the traveller
    const traveller = await AuthUser.findOne({ userId, role: 'traveller' });

    if (!traveller) {
      res.status(404).json({
        success: false,
        message: 'Traveller not found',
      });
      return;
    }

    // Check if traveller is already blocked
    if (!traveller.isActive) {
      res.status(400).json({
        success: false,
        message: 'Traveller is already blocked',
      });
      return;
    }

    // Update isActive to false and save block reason
    traveller.isActive = false;
    traveller.blockReason = blockReason.trim();
    await traveller.save();

    console.log(`Traveller ${userId} blocked by admin. Reason: ${blockReason}`);

    res.status(200).json({
      success: true,
      message: 'Traveller blocked successfully',
      data: {
        userId: traveller.userId,
        fullName: traveller.fullName,
        email: traveller.email,
        status: 'Blocked',
        blockReason: blockReason.trim(),
        blockedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error blocking traveller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block traveller',
      error: error.message,
    });
  }
};

/**
 * Unblock a traveller - Set isActive to true
 */
export const unblockTraveller = async (
  req: Request<{}, {}, UnblockTravellerRequest>,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'userId is required',
      });
      return;
    }

    // Find the traveller
    const traveller = await AuthUser.findOne({ userId, role: 'traveller' });

    if (!traveller) {
      res.status(404).json({
        success: false,
        message: 'Traveller not found',
      });
      return;
    }

    // Check if traveller is actually blocked
    if (traveller.isActive) {
      res.status(400).json({
        success: false,
        message: 'Traveller is not blocked',
      });
      return;
    }

    // Update isActive to true and clear block reason
    traveller.isActive = true;
    traveller.blockReason = null;
    await traveller.save();

    console.log(`Traveller ${userId} unblocked by admin`);

    res.status(200).json({
      success: true,
      message: 'Traveller unblocked successfully',
      data: {
        userId: traveller.userId,
        fullName: traveller.fullName,
        email: traveller.email,
        status: 'Active',
        unblockedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error unblocking traveller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock traveller',
      error: error.message,
    });
  }
};
