import { Request, Response } from 'express';
import AuthUser from '../../Model/authModel';

interface TravellerListRequest {
  page?: number;
  limit?: number;
  sort?: 'A-Z' | 'Z-A' | 'DateJoined';
  status?: 'ALL' | 'ACTIVE' | 'BLOCKED';
}

export const getTravellerList = async (
  req: Request<{}, {}, TravellerListRequest>,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.body.page) || 1);
    const limit = Math.max(1, Number(req.body.limit) || 10);
    const skip = (page - 1) * limit;
    const { sort = 'DateJoined', status = 'ALL' } = req.body;

    // Build aggregation pipeline
    const pipeline: any[] = [
      // 1. Match only users with role 'traveller'
      { $match: { role: 'traveller' } },

      // 2. Filter by status if not ALL
      ...(status !== 'ALL'
        ? [{ $match: { isActive: status === 'ACTIVE' } }]
        : []),

      // 3. Sort
      {
        $sort:
          sort === 'A-Z'
            ? { fullName: 1 }
            : sort === 'Z-A'
              ? { fullName: -1 }
              : { createdAt: -1 }, // Default to DateJoined (newest first)
      },

      // 4. Facet for pagination and data
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
