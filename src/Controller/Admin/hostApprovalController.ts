import { Request, Response } from 'express';
import HostProfile from '../../Model/hostModel';
import AuthUser from '../../Model/authModel';

interface ApproveHostRequest {
  hostId: string;
}

interface BlockHostRequest {
  hostId: string;
  blockReason: string;
}

interface UnblockHostRequest {
  hostId: string;
}

interface RejectHostRequest {
  hostId: string;
  rejectReason: string;
}

interface DeleteHostRequest {
  hostId: string;
}

/**
 * Approve a host - Change status from PENDING to APPROVED
 */
export const approveHost = async (
  req: Request<{}, {}, ApproveHostRequest>,
  res: Response
): Promise<void> => {
  try {
    const { hostId } = req.body;

    if (!hostId) {
      res.status(400).json({
        success: false,
        message: 'hostId is required',
      });
      return;
    }

    // Find the host profile
    const hostProfile = await HostProfile.findOne({ hostId });

    if (!hostProfile) {
      res.status(404).json({
        success: false,
        message: 'Host not found',
      });
      return;
    }

    // Check if host is already approved
    if (hostProfile.status === 'APPROVED') {
      res.status(400).json({
        success: false,
        message: 'Host is already approved',
      });
      return;
    }

    // Check if host is blocked
    if (hostProfile.status === 'BLOCKED') {
      res.status(400).json({
        success: false,
        message: 'Cannot approve a blocked host. Please unblock first.',
      });
      return;
    }

    // Update status to APPROVED
    hostProfile.status = 'APPROVED';
    await hostProfile.save();

    console.log(`Host ${hostId} approved by admin`);

    res.status(200).json({
      success: true,
      message: 'Host approved successfully',
      data: {
        hostId: hostProfile.hostId,
        userId: hostProfile.userId,
        status: hostProfile.status,
        approvedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error approving host:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve host',
      error: error.message,
    });
  }
};

/**
 * Block a host - Change status to BLOCKED with a reason
 */
export const blockHost = async (
  req: Request<{}, {}, BlockHostRequest>,
  res: Response
): Promise<void> => {
  try {
    const { hostId, blockReason } = req.body;

    if (!hostId) {
      res.status(400).json({
        success: false,
        message: 'hostId is required',
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

    // Find the host profile
    const hostProfile = await HostProfile.findOne({ hostId });

    if (!hostProfile) {
      res.status(404).json({
        success: false,
        message: 'Host not found',
      });
      return;
    }

    // Check if host is already blocked
    if (hostProfile.status === 'BLOCKED') {
      res.status(400).json({
        success: false,
        message: 'Host is already blocked',
        data: {
          blockReason: hostProfile.blockReason,
        },
      });
      return;
    }

    // Update status to BLOCKED and save reason
    hostProfile.status = 'BLOCKED';
    hostProfile.blockReason = blockReason.trim();
    await hostProfile.save();

    console.log(`Host ${hostId} blocked by admin. Reason: ${blockReason}`);

    res.status(200).json({
      success: true,
      message: 'Host blocked successfully',
      data: {
        hostId: hostProfile.hostId,
        userId: hostProfile.userId,
        status: hostProfile.status,
        blockReason: hostProfile.blockReason,
        blockedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error blocking host:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block host',
      error: error.message,
    });
  }
};

/**
 * Unblock a host - Change status from BLOCKED back to PENDING
 */
export const unblockHost = async (
  req: Request<{}, {}, UnblockHostRequest>,
  res: Response
): Promise<void> => {
  try {
    const { hostId } = req.body;

    if (!hostId) {
      res.status(400).json({
        success: false,
        message: 'hostId is required',
      });
      return;
    }

    // Find the host profile
    const hostProfile = await HostProfile.findOne({ hostId });

    if (!hostProfile) {
      res.status(404).json({
        success: false,
        message: 'Host not found',
      });
      return;
    }

    // Check if host is actually blocked
    if (hostProfile.status !== 'BLOCKED') {
      res.status(400).json({
        success: false,
        message: 'Host is not blocked',
        data: {
          currentStatus: hostProfile.status,
        },
      });
      return;
    }

    // Update status to PENDING and clear block reason
    const previousBlockReason = hostProfile.blockReason;
    hostProfile.status = 'APPROVED';
    hostProfile.blockReason = null;
    await hostProfile.save();

    console.log(`Host ${hostId} unblocked by admin`);

    res.status(200).json({
      success: true,
      message: 'Host unblocked successfully',
      data: {
        hostId: hostProfile.hostId,
        userId: hostProfile.userId,
        status: hostProfile.status,
        previousBlockReason,
        unblockedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error unblocking host:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock host',
      error: error.message,
    });
  }
};

/**
 * Reject a host - Change status from PENDING to REJECTED with a reason
 */
export const rejectHost = async (
  req: Request<{}, {}, RejectHostRequest>,
  res: Response
): Promise<void> => {
  try {
    const { hostId, rejectReason } = req.body;

    if (!hostId) {
      res.status(400).json({
        success: false,
        message: 'hostId is required',
      });
      return;
    }

    if (!rejectReason || rejectReason.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'rejectReason is required',
      });
      return;
    }

    // Find the host profile
    const hostProfile = await HostProfile.findOne({ hostId });

    if (!hostProfile) {
      res.status(404).json({
        success: false,
        message: 'Host not found',
      });
      return;
    }

    // Check if host is in PENDING state
    if (hostProfile.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        message: 'Host can only be rejected if in PENDING state',
        data: {
          currentStatus: hostProfile.status,
        },
      });
      return;
    }

    // Update status to REJECTED and save reason
    hostProfile.status = 'REJECTED';
    hostProfile.rejectReason = rejectReason.trim();
    await hostProfile.save();

    console.log(`Host ${hostId} rejected by admin. Reason: ${rejectReason}`);

    res.status(200).json({
      success: true,
      message: 'Host rejected successfully',
      data: {
        hostId: hostProfile.hostId,
        userId: hostProfile.userId,
        status: hostProfile.status,
        rejectReason: hostProfile.rejectReason,
        rejectedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error rejecting host:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject host',
      error: error.message,
    });
  }
};

/**
 * Delete a host - Set isActive to false in AuthUser model
 */
export const deleteHost = async (
  req: Request<{}, {}, DeleteHostRequest>,
  res: Response
): Promise<void> => {
  try {
    const { hostId } = req.body;

    if (!hostId) {
      res.status(400).json({
        success: false,
        message: 'hostId is required',
      });
      return;
    }

    // Find the host profile
    const hostProfile = await HostProfile.findOne({ hostId });

    if (!hostProfile) {
      res.status(404).json({
        success: false,
        message: 'Host not found',
      });
      return;
    }

    // Find the auth user by userId from host profile
    const authUser = await AuthUser.findOne({ userId: hostProfile.userId });

    if (!authUser) {
      res.status(404).json({
        success: false,
        message: 'Auth user not found for this host',
      });
      return;
    }

    // Check if already inactive
    if (!authUser.isActive) {
      res.status(400).json({
        success: false,
        message: 'Host is already inactive',
        data: {
          hostId: hostProfile.hostId,
          userId: authUser.userId,
          isActive: authUser.isActive,
        },
      });
      return;
    }

    // Set isActive to false
    authUser.isActive = false;
    await authUser.save();

    console.log(`Host ${hostId} deleted (isActive set to false) by admin`);

    res.status(200).json({
      success: true,
      message: 'Host deleted successfully',
      data: {
        hostId: hostProfile.hostId,
        userId: authUser.userId,
        isActive: authUser.isActive,
        deletedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error deleting host:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete host',
      error: error.message,
    });
  }
};
