import { Request, Response } from 'express';
import Transaction from '../../Model/transactionsModel';

export const transactionTableData = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.body;

    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Transaction.countDocuments({ status: 'SUCCESS' });

    // Determine sort field and order
    let sortField = 'DateOfPayment';
    if (sortBy === 'amount') {
      sortField = 'amount';
    }
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Aggregate to get the required data
    const transactions = await Transaction.aggregate([
      { $match: { status: 'SUCCESS' } },
      {
        $lookup: {
          from: 'stories',
          localField: 'storyId',
          foreignField: 'storyId',
          as: 'story',
        },
      },
      {
        $lookup: {
          from: 'authusers',
          localField: 'userId',
          foreignField: 'userId',
          as: 'user',
        },
      },
      { $unwind: { path: '$story', preserveNullAndEmptyArrays: false } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          razorpayOrderId: 1,
          storyName: '$story.storyTitle',
          TravellerName: '$user.fullName',
          amount: { $divide: ['$amount', 100] },
          paymentMethod: '$paymentDetails.method',
          DateOfPayment: '$createdAt',
        },
      },
      { $sort: { [sortField]: sortDirection } },
      { $skip: skip },
      { $limit: limit },
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transaction table data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const transactionDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { razorpayOrderId } = req.params;

    if (!razorpayOrderId) {
      res.status(400).json({
        success: false,
        message: 'razorpayOrderId is required',
      });
      return;
    }

    // Aggregate to get the transaction details with IST date and time
    const transaction = await Transaction.aggregate([
      { $match: { razorpayOrderId } },
      {
        $project: {
          Amount: { $divide: ['$amount', 100] },
          Date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: '+05:30',
            },
          },
          Time: {
            $dateToString: {
              format: '%H:%M:%S',
              date: '$createdAt',
              timezone: '+05:30',
            },
          },
          razorpayPaymentId: 1,
          bankRRN: '$paymentDetails.bankRRN',
          razorpayOrderId: 1,
          bookingId: 1,
          feeDetails: 1,
          vpa: '$paymentDetails.vpa',
          method: '$paymentDetails.method',
        },
      },
    ]);

    if (!transaction || transaction.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: transaction[0],
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
