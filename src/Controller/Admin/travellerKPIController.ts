import { Request, Response } from 'express';
import AuthUser from '../../Model/authModel';
import Booking from '../../Model/bookingModel';
import Story from '../../Model/storyModel';

interface TravellerListRequest {
  page?: number;
  limit?: number;
  sort?: 'A-Z' | 'Z-A' | 'DateJoined';
  status?: 'ALL' | 'ACTIVE' | 'BLOCKED';
  search?: string;
}

export const getTravellerList = async (
  req: Request<{}, {}, TravellerListRequest>,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.body.page) || 1);
    const limit = Math.max(1, Number(req.body.limit) || 10);
    const skip = (page - 1) * limit;
    const { sort = 'DateJoined', status = 'ALL', search } = req.body;

    // Build aggregation pipeline
    const pipeline: any[] = [
      // 1. Match only users with role 'traveller'
      { $match: { role: 'traveller' } },

      // 2. Filter by status if not ALL
      ...(status !== 'ALL'
        ? [{ $match: { isActive: status === 'ACTIVE' } }]
        : []),

      // 3. Search filter - search in fullName, email, phoneNumber
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { fullName: { $regex: search, $options: 'i' } },
                  { email: { $regex: search, $options: 'i' } },
                  { phoneNumber: { $regex: search, $options: 'i' } },
                ],
              },
            },
          ]
        : []),

      // 4. Sort
      {
        $sort:
          sort === 'A-Z'
            ? { fullName: 1 }
            : sort === 'Z-A'
              ? { fullName: -1 }
              : { createdAt: -1 }, // Default to DateJoined (newest first)
      },

      // 5. Facet for pagination and data
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                userId: '$userId',
                fullName: '$fullName',
                email: '$email',
                dateJoined: '$createdAt',
                status: {
                  $cond: {
                    if: '$isActive',
                    then: 'Active',
                    else: 'Blocked',
                  },
                },
                blockReason: '$blockReason',
              },
            },
          ],
        },
      },
    ];

    const result = await AuthUser.aggregate(pipeline);

    const metadata = result[0].metadata[0] || { total: 0 };
    const travellers = result[0].data;

    res.status(200).json({
      success: true,
      message: 'Traveller list retrieved successfully',
      data: {
        travellers,
        pagination: {
          total: metadata.total,
          page,
          limit,
          totalPages: Math.ceil(metadata.total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching traveller list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch traveller list',
      error: error.message,
    });
  }
};

/**
 * Get detailed information about a specific traveller
 * @route GET /api/admin/travellers/:userId
 */
export const getTravellerDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'userId is required',
      });
      return;
    }

    // Fetch traveller from AuthUser
    const traveller = await AuthUser.findOne({ userId, role: 'traveller' });

    if (!traveller) {
      res.status(404).json({
        success: false,
        message: 'Traveller not found',
      });
      return;
    }

    // Fetch all bookings for this traveller
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });

    // Calculate statistics
    const totalBookings = bookings.length;
    const totalAmountSpent = bookings.reduce((sum, booking) => {
      const bookingTotal = booking.paymentDetails.reduce(
        (pSum, payment) => pSum + payment.totalPayment,
        0
      );
      return sum + bookingTotal;
    }, 0);

    // Count completed trips (bookingStatus: 'success' and endDate in the past)
    const now = new Date();
    const completedTrips = bookings.filter(
      booking => booking.bookingStatus === 'success' && booking.endDate < now
    ).length;

    // Fetch story details for each booking and build booked stories array
    const bookedStories = await Promise.all(
      bookings.map(async booking => {
        const story = await Story.findOne({ storyId: booking.storyId });

        // Get host name from story's hostName field (primary) or from AuthUser (fallback)
        let hostName = 'N/A';
        if (story) {
          if (story.hostName) {
            hostName = story.hostName;
          } else if (story.createdBy) {
            const host = await AuthUser.findOne({ userId: story.createdBy });
            hostName = host?.fullName || 'N/A';
          }
        }

        // Determine booking status display
        let bookingStatusDisplay = 'Upcoming';
        if (booking.bookingStatus === 'rejected') {
          bookingStatusDisplay = 'Cancelled';
        } else if (
          booking.bookingStatus === 'success' &&
          booking.endDate < now
        ) {
          bookingStatusDisplay = 'Completed';
        } else if (booking.bookingStatus === 'pending') {
          bookingStatusDisplay = 'Pending';
        }

        // Calculate total amount paid for this booking
        const amountPaid = booking.paymentDetails.reduce(
          (sum, payment) => sum + payment.totalPayment,
          0
        );

        return {
          bookingId: booking.bookingId,
          storyName: story?.storyTitle || 'N/A',
          hostName,
          bookingDate: booking.createdAt,
          tripStartDate: booking.startDate,
          tripEndDate: booking.endDate,
          amountPaid,
          bookingStatus: bookingStatusDisplay,
        };
      })
    );

    // Build response
    const response = {
      success: true,
      message: 'Traveller details retrieved successfully',
      data: {
        basicInfo: {
          fullName: traveller.fullName,
          email: traveller.email,
          phoneNumber: traveller.phoneNumber || 'N/A',
          userId: traveller.userId,
          role: 'Traveller',
          dateJoined: traveller.createdAt,
          status: traveller.isActive ? 'Active' : 'Blocked',
          blockReason: traveller.blockReason || null,
        },
        statistics: {
          totalBookings,
          totalAmountSpent,
          completedTrips,
        },
        bookedStories,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error fetching traveller details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch traveller details',
      error: error.message,
    });
  }
};
