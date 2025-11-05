import { Request, Response } from 'express';
import mongoose from 'mongoose';
const expressValidator = require('express-validator');
const { body, validationResult } = expressValidator;
import Booking from '../../Model/booking';
import Story from '../../Model/storyModel';

export interface CreateBookingRequest {
  storyId: string;
  startDate: string;
  endDate: string;
  travellers: Array<{
    fullName: string;
    emailAddress: string;
    phoneNumber: string;
    noOfTravellers: number;
  }>;
  paymentDetails: Array<{
    totalBase: number;
    platformFee?: number;
    discount?: number;
    totalPayment: number;
  }>;
}

// Validation middleware
export const validateBooking = [
  body('startDate').isISO8601().withMessage('Valid startDate is required'),
  body('endDate').isISO8601().withMessage('Valid endDate is required'),
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
  body('travellers.*.noOfTravellers')
    .isInt({ min: 1 })
    .withMessage('noOfTravellers must be at least 1'),
  body('paymentDetails')
    .isArray({ min: 1 })
    .withMessage('At least one payment detail is required'),
  body('paymentDetails.*.totalBase')
    .isFloat({ min: 0 })
    .withMessage('totalBase must be non-negative'),
  body('paymentDetails.*.platformFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('platformFee must be non-negative'),
  body('paymentDetails.*.discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('discount must be non-negative'),
  body('paymentDetails.*.totalPayment')
    .isFloat({ min: 0 })
    .withMessage('totalPayment must be non-negative'),
];

/**
 * Check if booking dates are within story availability
 */
async function checkDateRangeValidity(
  storyId: string,
  startDate: Date,
  endDate: Date,
  session: mongoose.ClientSession
): Promise<{ isValid: boolean; story?: any }> {
  const story = await Story.findById(storyId)
    .select('startDate endDate status')
    .session(session)
    .lean();

  if (!story) {
    return { isValid: false };
  }

  if (story.status !== 'PUBLISHED') {
    return { isValid: false };
  }

  if (startDate < story.startDate || endDate > story.endDate) {
    return { isValid: false };
  }

  return { isValid: true, story };
}

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
        storyId: new mongoose.Types.ObjectId(storyId),
        status: 'confirmed',
        startDate: { $lte: date },
        endDate: { $gte: date },
      },
    },
    {
      $unwind: '$travellers',
    },
    {
      $group: {
        _id: null,
        totalBooked: { $sum: '$travellers.noOfTravellers' },
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
  // Get story max capacity
  const story = await Story.findById(storyId)
    .select('maxTravelersPerDay')
    .session(session)
    .lean();

  if (!story) {
    throw new Error('Story not found');
  }

  const maxCapacity = story.maxTravelersPerDay;

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

  const { storyId, startDate, endDate, travellers, paymentDetails } = req.body;

  // Calculate total travellers
  const totalTravellers = travellers.reduce(
    (sum, traveller) => sum + traveller.noOfTravellers,
    0
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Convert dates
      const bookingStartDate = new Date(startDate);
      const bookingEndDate = new Date(endDate);

      // Validate date range against story availability
      const dateValidation = await checkDateRangeValidity(
        storyId,
        bookingStartDate,
        bookingEndDate,
        session
      );

      if (!dateValidation.isValid) {
        throw new Error(
          'Booking dates are not within story availability or story is not published'
        );
      }

      // Check capacity for all dates in the range
      const capacityCheck = await checkCapacityForDateRange(
        storyId,
        bookingStartDate,
        bookingEndDate,
        totalTravellers,
        session
      );

      if (!capacityCheck.hasCapacity) {
        throw new Error(
          `Booking exceeds maximum capacity of ${capacityCheck.maxCapacity} travellers per day`
        );
      }

      // Set default platform fee if not provided
      const processedPaymentDetails = paymentDetails.map(detail => ({
        ...detail,
        platformFee: detail.platformFee ?? 50,
        discount: detail.discount ?? 0,
      }));

      // Create booking
      const booking = new Booking({
        storyId,
        startDate: bookingStartDate,
        endDate: bookingEndDate,
        travellers,
        paymentDetails: processedPaymentDetails,
        status: 'confirmed',
      });

      await booking.save({ session });

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: {
          bookingId: booking.bookingId,
          storyId: booking.storyId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalTravellers: booking.totalTravellers,
          status: booking.status,
          createdAt: booking.createdAt,
        },
      });
    });
  } catch (error: any) {
    console.error('Booking creation failed:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Booking creation failed',
    });
  } finally {
    await session.endSession();
  }
};
