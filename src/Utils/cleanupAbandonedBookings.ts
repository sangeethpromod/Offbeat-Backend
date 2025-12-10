import Booking from '../Model/bookingModel';
import Transaction from '../Model/transactionsModel';

/**
 * Cleanup abandoned bookings that are pending for more than specified minutes
 * These are bookings where payment was never completed
 */
export const cleanupAbandonedBookings = async (
  timeoutMinutes: number = 30
): Promise<{
  cleaned: number;
  errors: number;
}> => {
  try {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    // Find pending bookings older than timeout
    const abandonedBookings = await Booking.find({
      bookingStatus: 'pending',
      createdAt: { $lt: cutoffTime },
    });

    let cleaned = 0;
    let errors = 0;

    for (const booking of abandonedBookings) {
      try {
        // Check if there's a successful transaction for this booking
        const successfulTransaction = await Transaction.findOne({
          bookingId: booking.bookingId,
          status: 'SUCCESS',
        });

        if (!successfulTransaction) {
          // No successful payment - mark as rejected
          booking.bookingStatus = 'rejected';
          booking.status = 'cancelled';
          await booking.save();
          cleaned++;

          console.log('Cleaned abandoned booking:', {
            bookingId: booking.bookingId,
            userId: booking.userId,
            createdAt: booking.createdAt,
            age: Math.round((Date.now() - booking.createdAt.getTime()) / 60000),
          });
        }
      } catch (error) {
        console.error('Error cleaning booking:', booking.bookingId, error);
        errors++;
      }
    }

    console.log('Abandoned booking cleanup completed', {
      totalFound: abandonedBookings.length,
      cleaned,
      errors,
      timestamp: new Date().toISOString(),
    });

    return { cleaned, errors };
  } catch (error) {
    console.error('Error in cleanupAbandonedBookings:', error);
    throw error;
  }
};

/**
 * Start periodic cleanup job
 * Runs every 15 minutes by default
 */
export const startCleanupJob = (
  intervalMinutes: number = 15,
  timeoutMinutes: number = 30
): NodeJS.Timeout => {
  console.log('Starting abandoned booking cleanup job', {
    intervalMinutes,
    timeoutMinutes,
  });

  // Run immediately on startup
  cleanupAbandonedBookings(timeoutMinutes).catch(console.error);

  // Then run periodically
  return setInterval(
    () => {
      cleanupAbandonedBookings(timeoutMinutes).catch(console.error);
    },
    intervalMinutes * 60 * 1000
  );
};
