import { Request, Response } from 'express';
import AuthUser from '../../Model/authModel';
import HostProfile from '../../Model/hostModel';
import Story from '../../Model/storyModel';
import Booking from '../../Model/bookingModel';

interface HostListRequest {
  page?: number;
  limit?: number;
  sort?: 'A-Z' | 'Z-A' | 'DateJoined';
  status?: 'ALL' | 'ACTIVE' | 'PENDING' | 'BLOCKED' | 'REJECTED';
  search?: string;
}

export const getHostList = async (
  req: Request<{}, {}, HostListRequest>,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.body.page) || 1);
    const limit = Math.max(1, Number(req.body.limit) || 10);
    const skip = (page - 1) * limit;
    const { sort = 'DateJoined', status = 'ALL', search } = req.body;

    // Map ACTIVE to APPROVED for filtering
    const filterStatus = status === 'ACTIVE' ? 'APPROVED' : status;

    // Build aggregation pipeline
    const pipeline: any[] = [
      // 1. Match only users with role 'host'
      { $match: { role: 'host' } },

      // 2. Lookup HostProfile to get host details
      {
        $lookup: {
          from: 'hostprofiles', // collection name is lowercase plural
          localField: 'userId',
          foreignField: 'userId',
          as: 'profile',
        },
      },

      // 3. Unwind profile - DO NOT preserve null/empty arrays (only include hosts with profiles)
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: false, // This ensures we only get hosts with profiles
        },
      },

      // 4. Filter by status if not ALL
      ...(filterStatus !== 'ALL'
        ? [{ $match: { 'profile.status': filterStatus } }]
        : []),

      // 5. Search filter - search in fullName, email, mobileNumber, hostId
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { fullName: { $regex: search, $options: 'i' } },
                  { email: { $regex: search, $options: 'i' } },
                  { 'profile.mobileNumber': { $regex: search, $options: 'i' } },
                  { 'profile.hostId': { $regex: search, $options: 'i' } },
                ],
              },
            },
          ]
        : []),

      // 6. Sort
      {
        $sort:
          sort === 'A-Z'
            ? { fullName: 1 }
            : sort === 'Z-A'
              ? { fullName: -1 }
              : { createdAt: -1 }, // Default to DateJoined (newest first)
      },

      // 7. Facet for pagination and data
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                hostID: '$profile.hostId',
                userID: '$userId',
                fullName: '$fullName',
                emailID: '$email',
                mobileNumber: '$profile.mobileNumber',
                nationality: '$profile.nationality',
                dateJoined: '$createdAt',
                status: {
                  $cond: {
                    if: { $eq: ['$profile.status', 'APPROVED'] },
                    then: 'ACTIVE',
                    else: '$profile.status',
                  },
                },
                blockReason: '$profile.blockReason',
                rejectReason: '$profile.rejectReason',
              },
            },
          ],
        },
      },
    ];

    const result = await AuthUser.aggregate(pipeline);

    const metadata = result[0].metadata[0] || { total: 0 };
    const hosts = result[0].data;

    res.status(200).json({
      success: true,
      message: 'Host list retrieved successfully',
      data: {
        hosts,
        pagination: {
          total: metadata.total,
          page,
          limit,
          totalPages: Math.ceil(metadata.total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching host list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch host list',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/hosts/:userId
 * Get detailed host information by userId (Admin only)
 */
export const getHostDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }

    // Find the user
    const user = await AuthUser.findOne({ userId });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (user.role !== 'host') {
      res.status(400).json({
        success: false,
        message: 'User is not a host',
      });
      return;
    }

    // Find the host profile
    const hostProfile = await HostProfile.findOne({ userId });

    if (!hostProfile) {
      res.status(404).json({
        success: false,
        message: 'Host profile not found',
      });
      return;
    }

    // Get all stories created by this host
    const stories = await Story.find({ createdBy: userId }).sort({
      createdAt: -1,
    });

    // Get booking statistics for each story
    const storyDetailsPromises = stories.map(async story => {
      const bookingCount = await Booking.countDocuments({
        storyId: story.storyId,
      });

      // Calculate total earnings for this story
      const bookings = await Booking.find({ storyId: story.storyId });
      const totalEarnings = bookings.reduce((sum, booking) => {
        return sum + (booking.paymentDetails?.[0]?.grandTotal || 0);
      }, 0);

      return {
        storyId: story.storyId,
        storyName: story.storyTitle,
        destination: story.location,
        state: story.state,
        status:
          story.status === 'APPROVED'
            ? 'Active'
            : story.status === 'PUBLISHED'
              ? 'Pending'
              : story.status === 'BLOCKED'
                ? 'Rejected'
                : story.status,
        bookingsCount: bookingCount,
        earnings: totalEarnings,
      };
    });

    const storyDetails = await Promise.all(storyDetailsPromises);

    // Calculate overall statistics
    const totalStories = stories.length;
    const pendingApprovals = stories.filter(
      s => s.status === 'PUBLISHED'
    ).length;
    const totalBookingsCount = storyDetails.reduce(
      (sum, s) => sum + s.bookingsCount,
      0
    );
    const totalEarnings = storyDetails.reduce((sum, s) => sum + s.earnings, 0);

    // Mask Aadhar number (show only last 4 digits)
    const maskedAadhar = hostProfile.aadharNumber
      ? `XXXX-XXXX-${hostProfile.aadharNumber.slice(-4)}`
      : null;

    // Calculate onboarding completion percentage
    const onboardingPercentage = hostProfile.isOnboardingComplete
      ? 100
      : Math.round((hostProfile.onboardingStep / 3) * 100);

    // Build response
    const response = {
      success: true,
      data: {
        // Basic Information
        hostId: hostProfile.hostId,
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        isEmailVerified: hostProfile.isEmailVerified,
        mobileNumber: hostProfile.mobileNumber || null,
        nationality: hostProfile.nationality || null,
        location: hostProfile.location || null,
        status: hostProfile.status,
        blockReason: hostProfile.blockReason || null,
        rejectReason: hostProfile.rejectReason || null,
        isActive: user.isActive,

        // Onboarding Summary
        onboardingSummary: {
          currentStep: hostProfile.onboardingStep,
          totalSteps: 3,
          isComplete: hostProfile.isOnboardingComplete,
          completionPercentage: onboardingPercentage,
        },

        // Personal Information
        personalInfo: {
          age: hostProfile.age || null,
          gender: hostProfile.gender || null,
          nationality: hostProfile.nationality || null,
          location: hostProfile.location || null,
          aadharNumber: maskedAadhar,
        },

        // Document Verification
        documents: {
          aadharDocs: hostProfile.aadharDocs || [],
          pccCertificateUrl: hostProfile.pccCertificateUrl || null,
          livePicUrl: hostProfile.livePicUrl || null,
        },

        // Statistics
        statistics: {
          totalStories,
          pendingApprovals,
          totalBookings: totalBookingsCount,
          totalEarnings,
        },

        // Story List Preview
        stories: storyDetails,

        // Timestamps
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error fetching host details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch host details',
      error: error.message,
    });
  }
};
