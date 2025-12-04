import { Request, Response } from 'express';
import Booking from '../../../Model/bookingModel';
import newrelic from 'newrelic';

/**
 * Reject a booking (Host only)
 */
export const rejectBooking = async (
  req: Request<{ bookingId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const hostId = (req as any).jwtUser?.userId;
    const role = (req as any).jwtUser?.role;

    if (!hostId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Check if user has Host role
    if (role !== 'host') {
      res.status(403).json({
        success: false,
        message: 'Only hosts can reject bookings',
      });
      return;
    }

    // Find the booking and verify it belongs to the host's story
    const booking = await Booking.findOne({ bookingId }).populate({
      path: 'storyId',
      select: 'createdBy storyTitle',
      model: 'Story',
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Check if the booking belongs to the host's story
    const story = booking.storyId as any;
    if (story.createdBy !== hostId) {
      res.status(403).json({
        success: false,
        message: 'You can only reject bookings for your own stories',
      });
      return;
    }

    // Check if booking is already rejected
    if (booking.bookingStatus === 'rejected') {
      res.status(400).json({
        success: false,
        message: 'Booking is already rejected',
      });
      return;
    }

    // Update booking status to rejected
    booking.bookingStatus = 'rejected';
    await booking.save();

    // Track rejection
    newrelic.recordCustomEvent('BookingRejected', {
      bookingId,
      hostId,
      storyId: story.storyId,
      travellerId: booking.userId,
    });

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: {
        bookingId: booking.bookingId,
        bookingStatus: booking.bookingStatus,
        storyTitle: story.storyTitle,
      },
    });
  } catch (error: any) {
    console.error('Error rejecting booking:', error);
    newrelic.noticeError(error, {
      bookingId: req.params.bookingId,
      hostId: (req as any).jwtUser?.userId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to reject booking',
      error: error.message,
    });
  }
};
