import { Request, Response } from 'express';
import crypto from 'crypto';
import Transaction from '../../Model/transactionsModel';
import Booking from '../../Model/bookingModel';
import {
  razorpayClient,
  RZP_KEY_ID,
  RZP_KEY_SECRET_SAFE,
  RZP_WEBHOOK_SECRET,
} from '../../Config/rayzorpay';
import newrelic from 'newrelic';

interface CreateOrderRequest {
  bookingId: string;
  storyId: string;
  amount: number;
  baseAmount: number;
  discount: number;
  travellers: any[];
}

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  transactionId: string;
}

/**
 * Create Razorpay order and initialize transaction
 */
export const createRazorpayOrder = async (
  req: Request<{}, {}, CreateOrderRequest>,
  res: Response
): Promise<void> => {
  try {
    const { bookingId, storyId, amount, baseAmount, discount, travellers } =
      req.body;
    const userId = (req as any).jwtUser?.userId;

    // Strict input validation
    if (!bookingId || !storyId || !amount || !baseAmount || !travellers) {
      res.status(400).json({
        success: false,
        message:
          'Missing required fields: bookingId, storyId, amount, baseAmount, travellers',
      });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid amount. Must be a positive number',
      });
      return;
    }

    if (!Array.isArray(travellers) || travellers.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Travellers must be a non-empty array',
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Verify booking exists
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Convert amount to paise (Razorpay expects smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Create transaction record with INITIATED status
    const transaction = new Transaction({
      bookingId,
      storyId,
      userId,
      amount: amountInPaise,
      currency: 'INR',
      status: 'INITIATED',
      razorpayOrderId: '', // Will be updated after order creation
      meta: {
        baseAmount,
        discount: discount || 0,
        travellers,
        paymentGateway: 'RAZORPAY',
      },
    });

    // Create Razorpay order
    const razorpayOrder = await razorpayClient.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${transaction.transactionId}`,
      notes: {
        bookingId,
        storyId,
        userId,
        transactionId: transaction.transactionId,
      },
    });

    // Update transaction with Razorpay order ID
    transaction.razorpayOrderId = razorpayOrder.id;
    await transaction.save();

    // Track order creation
    newrelic.recordCustomEvent('RazorpayOrderCreated', {
      transactionId: transaction.transactionId,
      bookingId,
      amount: amountInPaise,
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        keyId: RZP_KEY_ID,
        orderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        transactionId: transaction.transactionId,
      },
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    newrelic.noticeError(error, {
      bookingId: req.body.bookingId,
      userId: (req as any).jwtUser?.userId,
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  }
};

/**
 * Verify Razorpay payment signature and update transaction status
 */
export const verifyRazorpayPayment = async (
  req: Request<{}, {}, VerifyPaymentRequest>,
  res: Response
): Promise<void> => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = req.body;

    // Validate input
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !transactionId
    ) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields for payment verification',
      });
      return;
    }

    // Find transaction
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
      return;
    }

    // Verify signature using HMAC SHA256
    const generatedSignature = crypto
      .createHmac('sha256', RZP_KEY_SECRET_SAFE)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Signature mismatch - mark as FAILED
      transaction.status = 'FAILED';
      await transaction.save();

      newrelic.recordCustomEvent('RazorpayPaymentVerificationFailed', {
        transactionId,
        razorpayOrderId: razorpay_order_id,
        reason: 'signature_mismatch',
      });

      res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature',
      });
      return;
    }

    // Signature valid - update transaction
    transaction.status = 'SUCCESS';
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    await transaction.save();

    // Update booking status
    const booking = await Booking.findOne({ bookingId: transaction.bookingId });
    if (booking) {
      booking.status = 'confirmed';
      booking.bookingStatus = 'success';
      await booking.save();
    }

    newrelic.recordCustomEvent('RazorpayPaymentVerified', {
      transactionId,
      bookingId: transaction.bookingId,
      razorpayPaymentId: razorpay_payment_id,
      amount: transaction.amount,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        transactionId,
        status: 'SUCCESS',
      },
    });
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    newrelic.noticeError(error, {
      transactionId: req.body.transactionId,
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed',
    });
  }
};

/**
 * Handle Razorpay webhook events with signature validation
 * CRITICAL: Must validate webhook signature to prevent fraud
 */
export const razorpayWebhookHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'] as string;
    const webhookBody = JSON.stringify(req.body);

    if (!webhookSignature) {
      console.error('Webhook signature missing');
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing signature',
      });
      return;
    }

    // Validate webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', RZP_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      console.error('Webhook signature verification failed');
      newrelic.recordCustomEvent('RazorpayWebhookSignatureFailed', {
        receivedSignature: webhookSignature.substring(0, 20),
      });

      res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid signature',
      });
      return;
    }

    // Signature valid - process event
    const event = req.body.event;
    const payload = req.body.payload?.payment?.entity;

    if (event === 'payment.captured') {
      const orderId = payload?.order_id;
      const paymentId = payload?.id;
      const amountPaid = payload?.amount;

      if (!orderId) {
        console.error('Order ID missing in webhook payload');
        res.status(200).send('OK'); // Return 200 to prevent retries
        return;
      }

      // Find transaction by Razorpay order ID
      const transaction = await Transaction.findOne({
        razorpayOrderId: orderId,
      });

      if (!transaction) {
        console.error(`Transaction not found for order ID: ${orderId}`);
        res.status(200).send('OK');
        return;
      }

      // Idempotent update - only update if not already SUCCESS
      if (transaction.status !== 'SUCCESS') {
        transaction.status = 'SUCCESS';
        transaction.razorpayPaymentId = paymentId;
        await transaction.save();

        // Update booking
        const booking = await Booking.findOne({
          bookingId: transaction.bookingId,
        });
        if (booking && booking.status !== 'confirmed') {
          booking.status = 'confirmed';
          booking.bookingStatus = 'success';
          await booking.save();
        }

        newrelic.recordCustomEvent('RazorpayWebhookPaymentCaptured', {
          transactionId: transaction.transactionId,
          bookingId: transaction.bookingId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          amount: amountPaid,
        });
      }
    }

    // Always return 200 for valid signature to prevent retries
    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Error processing Razorpay webhook:', error);
    newrelic.noticeError(error, {
      event: req.body?.event || 'unknown',
    });

    // Return 200 even on error to prevent retries for unrecoverable errors
    res.status(200).send('OK');
  }
};
