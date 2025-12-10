import { Request, Response } from 'express';
import mongoose from 'mongoose';
const expressValidator = require('express-validator');
const { body, validationResult } = expressValidator;
import Booking from '../../../Model/bookingModel';
import Story from '../../../Model/storyModel';
import newrelic from 'newrelic';
import { calculateStoryFees } from '../../../Utils/feeCalculator';

export interface CreateBookingRequest {
  storyId: string;
  startDate: string;
  endDate: string;
  noOfTravellers: number;
  travellers: Array<{
    fullName: string;
    emailAddress: string;
    phoneNumber: string;
  }>;
  paymentDetails: Array<{
    baseAmount: number;
    discount: number;
    fees: Array<{
      feeName: string;
      feeType: 'COMMISSION' | 'FLAT' | 'PERCENTAGE';
      value: number;
      calculatedAmount: number;
    }>;
    grandTotal: number;
  }>;
}

// Validation middleware
export const validateBooking = [
  body('startDate').isISO8601().withMessage('Valid startDate is required'),
  body('endDate').isISO8601().withMessage('Valid endDate is required'),
  body('noOfTravellers')
    .isInt({ min: 1 })
    .withMessage('noOfTravellers must be at least 1'),
  body('travellers')
    .isArray({ min: 1 })
    .withMessage('At least one traveller is required'),
  body('travellers.*.fullName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Traveller fullName is required'),
  body('travellers.*.emailAddress')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid emailAddress is required'),
  body('travellers.*.phoneNumber')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('paymentDetails')
    .isArray({ min: 1 })
    .withMessage('At least one payment detail is required'),
  body('paymentDetails.*.baseAmount')
    .isFloat({ min: 0 })
    .withMessage('baseAmount must be non-negative'),
  body('paymentDetails.*.discount')
    .isFloat({ min: 0 })
    .withMessage('discount must be non-negative'),
  body('paymentDetails.*.fees').isArray().withMessage('fees must be an array'),
  body('paymentDetails.*.fees.*.feeName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Fee name is required'),
  body('paymentDetails.*.fees.*.feeType')
    .isIn(['COMMISSION', 'FLAT', 'PERCENTAGE'])
    .withMessage('feeType must be COMMISSION, FLAT, or PERCENTAGE'),
  body('paymentDetails.*.fees.*.value')
    .isFloat({ min: 0 })
    .withMessage('fee value must be non-negative'),
  body('paymentDetails.*.fees.*.calculatedAmount')
    .isFloat({ min: 0 })
    .withMessage('calculatedAmount must be non-negative'),
  body('paymentDetails.*.grandTotal')
    .isFloat({ min: 0 })
    .withMessage('grandTotal must be non-negative'),
];

/**
 * Calculate total booked travellers for a specific date using aggregation
 */
async function getBookedTravellersForDate(
  storyId: string,
  date: Date,
  session: mongoose.ClientSession
): Promise<number> {
  const result = await Booking.aggregate([
    {
      $match: {
        storyId: storyId,
        status: 'confirmed',
        bookingStatus: 'success', // Only count successful paid bookings
        startDate: { $lte: date },
        endDate: { $gte: date },
      },
    },
    {
      $group: {
        _id: null,
        totalBooked: { $sum: '$noOfTravellers' },
      },
    },
  ]).session(session);

  return result.length > 0 ? result[0].totalBooked : 0;
}

/**
 * Check capacity for all dates in the booking range
 */
async function checkCapacityForDateRange(
  storyId: string,
  startDate: Date,
  endDate: Date,
  newBookingTravellers: number,
  session: mongoose.ClientSession
): Promise<{ hasCapacity: boolean; maxCapacity: number }> {
  // Get story max capacity by storyId (UUID)
  const story = await Story.findOne({ storyId })
    .select('availabilityType maxTravelersPerDay maxTravellersScheduled')
    .session(session)
    .lean();

  if (!story) {
    throw new Error('Story not found');
  }

  // Get max capacity based on availability type
  const maxCapacity =
    story.availabilityType === 'YEAR_ROUND'
      ? story.maxTravelersPerDay
      : story.maxTravellersScheduled;

  if (!maxCapacity) {
    throw new Error('Story capacity not defined');
  }

  // Check each date in the range
  for (
    let date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    const bookedTravellers = await getBookedTravellersForDate(
      storyId,
      new Date(date),
      session
    );

    if (bookedTravellers + newBookingTravellers > maxCapacity) {
      return { hasCapacity: false, maxCapacity };
    }
  }

  return { hasCapacity: true, maxCapacity };
}

/**
 * Create a new booking with capacity validation
 */
export const createBooking = async (
  req: Request<{}, {}, CreateBookingRequest>,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }

  const {
    storyId,
    startDate,
    endDate,
    noOfTravellers,
    travellers,
    paymentDetails,
  } = req.body;

  // Log booking attempt
  console.log('Booking creation started', {
    storyId,
    userId: (req as any).jwtUser?.userId,
    startDate,
    endDate,
    noOfTravellers,
    travellerDetailsCount: travellers.length,
    timestamp: new Date().toISOString(),
  });

  // Validate that travellers array length matches noOfTravellers
  if (travellers.length !== noOfTravellers) {
    console.error('Booking validation failed - traveller count mismatch', {
      storyId,
      userId: (req as any).jwtUser?.userId,
      expectedTravellers: noOfTravellers,
      providedTravellers: travellers.length,
      timestamp: new Date().toISOString(),
    });
    res.status(400).json({
      success: false,
      message: `Number of traveller details (${travellers.length}) must match noOfTravellers (${noOfTravellers})`,
    });
    return;
  }

  // Use the provided noOfTravellers count
  const totalTravellers = noOfTravellers;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // First, find the story by storyId (UUID) to validate it exists
      const story = await Story.findOne({ storyId })
        .select('_id storyId storyLength status maxTravelersPerDay')
        .lean();

      if (!story) {
        throw new Error('Story not found');
      }

      // Convert dates
      const bookingStartDate = new Date(startDate);
      const bookingEndDate = new Date(endDate);

      // Validate date range against story availability
      if (story.status !== 'APPROVED') {
        console.error('Booking date validation failed - story not approved', {
          storyId,
          userId: (req as any).jwtUser?.userId,
          startDate,
          endDate,
          storyStatus: story.status,
          storyLength: story.storyLength,
          timestamp: new Date().toISOString(),
        });
        throw new Error(
          'Booking duration must match story length or story is not approved'
        );
      }

      // Calculate booking duration (inclusive of both start and end dates)
      const bookingDuration =
        Math.ceil(
          (bookingEndDate.getTime() - bookingStartDate.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      console.log('Date validation calculation', {
        startDate: bookingStartDate.toISOString(),
        endDate: bookingEndDate.toISOString(),
        timeDifferenceMs: bookingEndDate.getTime() - bookingStartDate.getTime(),
        daysDifference:
          (bookingEndDate.getTime() - bookingStartDate.getTime()) /
          (1000 * 60 * 60 * 24),
        bookingDuration,
        storyLength: story.storyLength,
        willPass: bookingDuration === story.storyLength,
      });

      if (bookingDuration !== story.storyLength) {
        console.error('Booking date validation failed - duration mismatch', {
          storyId,
          userId: (req as any).jwtUser?.userId,
          startDate,
          endDate,
          storyStatus: story.status,
          storyLength: story.storyLength,
          bookingDuration,
          timestamp: new Date().toISOString(),
        });
        throw new Error(
          'Booking duration must match story length or story is not approved'
        );
      }

      // Log successful date validation
      console.log('Booking date validation passed', {
        storyId,
        userId: (req as any).jwtUser?.userId,
        startDate,
        endDate,
        storyLength: story.storyLength,
        bookingDuration,
        timestamp: new Date().toISOString(),
      });

      // Check capacity for all dates in the range
      const capacityCheck = await checkCapacityForDateRange(
        story.storyId, // Use the storyId from the database
        bookingStartDate,
        bookingEndDate,
        totalTravellers,
        session
      );

      if (!capacityCheck.hasCapacity) {
        console.error('Booking capacity validation failed', {
          storyId,
          userId: (req as any).jwtUser?.userId,
          requestedTravellers: totalTravellers,
          maxCapacity: capacityCheck.maxCapacity,
          startDate,
          endDate,
          timestamp: new Date().toISOString(),
        });
        throw new Error(
          `Booking exceeds maximum capacity of ${capacityCheck.maxCapacity} travellers per day`
        );
      }

      // Log successful capacity validation
      console.log('Booking capacity validation passed', {
        storyId,
        userId: (req as any).jwtUser?.userId,
        requestedTravellers: totalTravellers,
        maxCapacity: capacityCheck.maxCapacity,
        startDate,
        endDate,
        timestamp: new Date().toISOString(),
      });

      // Calculate fees dynamically for each payment detail and validate against frontend
      const processedPaymentDetails = await Promise.all(
        paymentDetails.map(async detail => {
          const baseAmount = detail.baseAmount;
          const discount = detail.discount;
          const totalAfterDiscount = Math.max(0, baseAmount - discount);

          // Calculate fees using the fee structure
          const { totalFees, feeBreakdown } = await calculateStoryFees(
            totalAfterDiscount,
            'TRAVELLER'
          );

          const serverGrandTotal = totalAfterDiscount + totalFees;

          // Validate frontend calculations against server calculations
          const frontendGrandTotal = detail.grandTotal;
          const frontendTotalFees = detail.fees.reduce(
            (sum, fee) => sum + fee.calculatedAmount,
            0
          );

          // Allow small floating-point differences (0.01)
          if (Math.abs(serverGrandTotal - frontendGrandTotal) > 0.01) {
            throw new Error(
              `Payment mismatch — invalid total provided. Expected ${serverGrandTotal.toFixed(
                2
              )}, received ${frontendGrandTotal.toFixed(2)}`
            );
          }

          if (Math.abs(totalFees - frontendTotalFees) > 0.01) {
            throw new Error(
              `Fee calculation mismatch. Expected total fees ${totalFees.toFixed(
                2
              )}, received ${frontendTotalFees.toFixed(2)}`
            );
          }

          // Return the validated payment detail with server-calculated values
          return {
            baseAmount,
            discount,
            totalAfterDiscount,
            fees: feeBreakdown,
            totalFees,
            grandTotal: serverGrandTotal,
          };
        })
      );

      // Create booking with PENDING status - will be confirmed after payment
      const booking = new Booking({
        storyId: story.storyId,
        userId: (req as any).jwtUser?.userId,
        startDate: bookingStartDate,
        endDate: bookingEndDate,
        noOfTravellers: totalTravellers,
        travellers,
        paymentDetails: processedPaymentDetails,
        status: 'confirmed', // Keep as confirmed for now for capacity tracking
        bookingStatus: 'pending', // Set to pending - will be success after payment
      });

      await booking.save({ session });

      // Log successful booking creation
      console.log('Booking created successfully', {
        bookingId: booking.bookingId,
        storyId,
        userId: (req as any).jwtUser?.userId,
        totalTravellers: booking.totalTravellers,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        timestamp: new Date().toISOString(),
      });

      // Return success response with full fee breakdown
      res.status(201).json({
        success: true,
        message: 'Booking created successfully. Proceed to payment.',
        data: {
          bookingId: booking.bookingId,
          storyId: story.storyId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalTravellers: booking.totalTravellers,
          status: booking.status,
          bookingStatus: booking.bookingStatus,
          paymentDetails: processedPaymentDetails.map(pd => ({
            baseAmount: pd.baseAmount,
            discount: pd.discount,
            totalAfterDiscount: pd.totalAfterDiscount,
            fees: pd.fees,
            totalFees: pd.totalFees,
            grandTotal: pd.grandTotal,
          })),
          createdAt: booking.createdAt,
        },
      });
    });
  } catch (error: any) {
    console.error('Booking creation failed', {
      storyId: req.body.storyId,
      userId: (req as any).jwtUser?.userId,
      errorMessage: error.message,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      noOfTravellers: req.body.noOfTravellers,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    });
    newrelic.noticeError(error, {
      storyId: req.body.storyId,
      userId: (req as any).jwtUser?.userId,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      noOfTravellers: req.body.noOfTravellers,
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Booking creation failed',
    });
  } finally {
    await session.endSession();
  }
};
