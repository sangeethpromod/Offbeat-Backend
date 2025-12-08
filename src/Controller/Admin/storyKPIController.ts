import { Request, Response } from 'express';
import Story from '../../Model/storyModel';

interface StoryListRequest {
  page?: number;
  limit?: number;
  sort?: 'A-Z' | 'Z-A' | 'Price';
  status?: 'ALL' | 'ACTIVE' | 'PENDING' | 'BLOCKED' | 'REJECTED';
  storyType?: 'ALL' | 'YEAR_ROUND' | 'TRAVEL_WITH_STARS';
  search?: string;
}

export const getStoryList = async (
  req: Request<{}, {}, StoryListRequest>,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.body.page) || 1);
    const limit = Math.max(1, Number(req.body.limit) || 10);
    const skip = (page - 1) * limit;
    const {
      sort = 'A-Z',
      status = 'ALL',
      storyType = 'ALL',
      search,
    } = req.body;

    // Map ACTIVE to APPROVED for filtering
    const filterStatus = status === 'ACTIVE' ? 'APPROVED' : status;

    // Build aggregation pipeline
    const pipeline: any[] = [
      // 1. Filter by status if not ALL
      ...(filterStatus !== 'ALL' ? [{ $match: { status: filterStatus } }] : []),

      // 2. Filter by storyType if not ALL
      ...(storyType !== 'ALL'
        ? [{ $match: { availabilityType: storyType } }]
        : []),

      // 3. Lookup host information
      {
        $lookup: {
          from: 'authusers',
          localField: 'createdBy',
          foreignField: 'userId',
          as: 'hostInfo',
        },
      },

      // 4. Unwind host info
      {
        $unwind: {
          path: '$hostInfo',
          preserveNullAndEmptyArrays: false,
        },
      },

      // 5. Search filter - search in storyTitle, hostName, location, state
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { storyTitle: { $regex: search, $options: 'i' } },
                  { 'hostInfo.fullName': { $regex: search, $options: 'i' } },
                  { location: { $regex: search, $options: 'i' } },
                  { state: { $regex: search, $options: 'i' } },
                ],
              },
            },
          ]
        : []),

      // 6. Lookup booking count
      {
        $lookup: {
          from: 'bookings',
          let: { storyId: '$storyId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$storyId', '$$storyId'] },
                status: 'confirmed',
              },
            },
            {
              $count: 'totalBookings',
            },
          ],
          as: 'bookingCount',
        },
      },

      // 7. Add totalBookings field
      {
        $addFields: {
          totalBookings: {
            $ifNull: [{ $arrayElemAt: ['$bookingCount.totalBookings', 0] }, 0],
          },
        },
      },

      // 8. Sort
      {
        $sort:
          sort === 'A-Z'
            ? { storyTitle: 1 }
            : sort === 'Z-A'
              ? { storyTitle: -1 }
              : { totalPrice: -1 }, // Price descending (highest first)
      },

      // 9. Facet for pagination and data
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                storyId: '$storyId',
                storyName: '$storyTitle',
                hostName: '$hostInfo.fullName',
                storyType: '$availabilityType',
                price: '$totalPrice',
                storyLength: '$storyLength',
                status: {
                  $cond: {
                    if: { $eq: ['$status', 'APPROVED'] },
                    then: 'ACTIVE',
                    else: {
                      $cond: {
                        if: { $eq: ['$status', 'BLOCKED'] },
                        then: 'BLOCKED',
                        else: {
                          $cond: {
                            if: { $eq: ['$status', 'PENDING'] },
                            then: 'PENDING',
                            else: {
                              $cond: {
                                if: { $eq: ['$status', 'REJECTED'] },
                                then: 'REJECTED',
                                else: '$status',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                totalBooking: '$totalBookings',
              },
            },
          ],
        },
      },
    ];

    const result = await Story.aggregate(pipeline);

    const metadata = result[0].metadata[0] || { total: 0 };
    const stories = result[0].data;

    res.status(200).json({
      success: true,
      message: 'Story list retrieved successfully',
      data: {
        stories,
        pagination: {
          total: metadata.total,
          page,
          limit,
          totalPages: Math.ceil(metadata.total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching story list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch story list',
      error: error.message,
    });
  }
};
