import { Request, Response } from 'express';
import AuthUser from '../../Model/authModel';

interface HostListRequest {
  page?: number;
  limit?: number;
  sort?: 'A-Z' | 'Z-A' | 'DateJoined';
  status?: 'ALL' | 'ACTIVE' | 'PENDING' | 'BLOCKED';
}

export const getHostList = async (
  req: Request<{}, {}, HostListRequest>,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.body.page) || 1);
    const limit = Math.max(1, Number(req.body.limit) || 10);
    const skip = (page - 1) * limit;
    const { sort = 'DateJoined', status = 'ALL' } = req.body;

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
      ...(status !== 'ALL' ? [{ $match: { 'profile.status': status } }] : []),

      // 5. Sort
      {
        $sort:
          sort === 'A-Z'
            ? { fullName: 1 }
            : sort === 'Z-A'
              ? { fullName: -1 }
              : { createdAt: -1 }, // Default to DateJoined (newest first)
      },

      // 6. Facet for pagination and data
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
                status: '$profile.status',
                blockReason: '$profile.blockReason',
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
