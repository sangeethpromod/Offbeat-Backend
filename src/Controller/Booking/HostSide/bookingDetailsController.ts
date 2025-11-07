import { Request, Response } from 'express';
import Booking from '../../../Model/bookingModel';
import newrelic from 'newrelic';

/**
 * Format date range for display (e.g., "10-15 Nov 2025")
 */
function formatDateRange(startDate: Date, endDate: Date): string {
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const month = startDate.toLocaleString('en-US', { month: 'short' });
  const year = startDate.getFullYear();

  return `${startDay}-${endDay} ${month} ${year}`;
}

/**
 * Get booking details summary by bookingId
 * Only accessible by admin and host roles
 */
export const getBookingDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      res.status(400).json({
        success: false,
        message: 'Booking ID is required',
      });
      return;
    }

    // Track API call
    newrelic.recordCustomEvent('BookingDetailsRetrievalStarted', {
      bookingId,
      userId: (req as any).jwtUser?.userId,
      userRole: (req as any).jwtUser?.role,
    });

    // Find booking with story details
    const booking = await Booking.findOne({ bookingId })
      .populate({
        path: 'storyId',
        model: 'Story',
        select: 'storyTitle storyDescription location state',
        foreignField: 'storyId',
        localField: 'storyId',
      })
      .lean();

    if (!booking) {
      newrelic.recordCustomEvent('BookingDetailsNotFound', {
        bookingId,
        userId: (req as any).jwtUser?.userId,
      });
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Extract story details
    const storyDetails = booking.storyId as any; // Populated story data

    if (!storyDetails) {
      newrelic.recordCustomEvent('BookingDetailsStoryNotFound', {
        bookingId,
        storyId: booking.storyId,
        userId: (req as any).jwtUser?.userId,
      });
      res.status(404).json({
        success: false,
        message: 'Story details not found for this booking',
      });
      return;
    }

    // Format the response
    const bookingSummary = {
      storyName: storyDetails.storyTitle,
      storyDescription: storyDetails.storyDescription,
      location: storyDetails.location,
      state: storyDetails.state,
      Dates: formatDateRange(booking.startDate, booking.endDate),
      phone: booking.travellers[0]?.phoneNumber || '',
      totalTravellers: booking.noOfTravellers,
      totalBase: booking.paymentDetails[0]?.totalBase || 0,
      platformFee: booking.paymentDetails[0]?.platformFee || 0,
      discount: booking.paymentDetails[0]?.discount || 0,
      totalPayment: booking.paymentDetails[0]?.totalPayment || 0,
      travellers: booking.travellers.map((traveller: any) => ({
        travellerName: traveller.fullName,
        travellerEmail: traveller.emailAddress,
        phoneNumber: traveller.phoneNumber,
      })),
    };

    // Track successful retrieval
    newrelic.recordCustomEvent('BookingDetailsRetrievedSuccessfully', {
      bookingId,
      userId: (req as any).jwtUser?.userId,
      storyId: booking.storyId,
      totalTravellers: booking.noOfTravellers,
    });

    res.status(200).json({
      success: true,
      message: 'Booking details retrieved successfully',
      data: bookingSummary,
    });
  } catch (error: any) {
    // Track error
    newrelic.recordCustomEvent('BookingDetailsRetrievalFailed', {
      bookingId: req.params.bookingId || '',
      userId: (req as any).jwtUser?.userId || '',
      errorMessage: error.message,
    });
    newrelic.noticeError(error, {
      bookingId: req.params.bookingId || '',
      userId: (req as any).jwtUser?.userId || '',
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking details',
      error: error.message,
    });
  }
};
