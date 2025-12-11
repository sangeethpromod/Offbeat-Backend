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
  grandTotal: number;
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
    const { bookingId, storyId, grandTotal } = req.body;
    const userId = (req as any).jwtUser?.userId;

    // Strict input validation
    if (!bookingId || !storyId || !grandTotal) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: bookingId, storyId, grandTotal',
      });
      return;
    }

    if (typeof grandTotal !== 'number' || grandTotal <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid grandTotal. Must be a positive number',
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

    // Verify booking exists and get payment details
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Verify grandTotal matches booking payment details
    const bookingGrandTotal = booking.paymentDetails[0]?.grandTotal || 0;
    if (Math.abs(bookingGrandTotal - grandTotal) > 0.01) {
      res.status(400).json({
        success: false,
        message: `Amount mismatch. Expected ${bookingGrandTotal}, received ${grandTotal}`,
      });
      return;
    }

    // Convert amount to paise (Razorpay expects smallest currency unit)
    const amountInPaise = Math.round(grandTotal * 100);

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
        paymentGateway: 'RAZORPAY',
      },
    });

    // Create Razorpay order
    const razorpayOrder = await razorpayClient.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: transaction.transactionId.substring(0, 40), // Max 40 chars for Razorpay
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

    // Fetch detailed payment information from Razorpay
    try {
      const paymentDetails =
        await razorpayClient.payments.fetch(razorpay_payment_id);

      // Extract payment method details
      const paymentDetailsData: any = {};
      if (paymentDetails.method)
        paymentDetailsData.method = paymentDetails.method;
      if (paymentDetails.acquirer_data?.rrn)
        paymentDetailsData.bankRRN = paymentDetails.acquirer_data.rrn;
      if (paymentDetails.invoice_id)
        paymentDetailsData.invoiceId = paymentDetails.invoice_id;
      if ((paymentDetails.acquirer_data as any)?.account_type)
        paymentDetailsData.payerAccountType = (
          paymentDetails.acquirer_data as any
        ).account_type;
      if (paymentDetails.vpa) paymentDetailsData.vpa = paymentDetails.vpa;
      if (paymentDetails.card?.network)
        paymentDetailsData.cardNetwork = paymentDetails.card.network;
      if (paymentDetails.card?.last4)
        paymentDetailsData.cardLast4 = paymentDetails.card.last4;
      if (paymentDetails.bank) paymentDetailsData.bank = paymentDetails.bank;
      if (paymentDetails.wallet)
        paymentDetailsData.wallet = paymentDetails.wallet;

      if (Object.keys(paymentDetailsData).length > 0) {
        transaction.paymentDetails = paymentDetailsData;
      }

      // Extract fee details
      const feeDetailsData: any = {};
      if (paymentDetails.fee !== undefined)
        feeDetailsData.totalFee = paymentDetails.fee;
      if (
        paymentDetails.fee !== undefined &&
        paymentDetails.tax !== undefined
      ) {
        feeDetailsData.razorpayFee = paymentDetails.fee - paymentDetails.tax;
      }
      if (paymentDetails.tax !== undefined)
        feeDetailsData.gst = paymentDetails.tax;

      if (Object.keys(feeDetailsData).length > 0) {
        transaction.feeDetails = feeDetailsData;
      }
    } catch (fetchError) {
      console.error(
        'Error fetching payment details from Razorpay:',
        fetchError
      );
      // Continue even if fetching details fails
    }

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

        // Fetch detailed payment information from Razorpay
        try {
          const paymentDetails = await razorpayClient.payments.fetch(paymentId);

          // Extract payment method details
          const paymentDetailsData: any = {};
          if (paymentDetails.method)
            paymentDetailsData.method = paymentDetails.method;
          if (paymentDetails.acquirer_data?.rrn)
            paymentDetailsData.bankRRN = paymentDetails.acquirer_data.rrn;
          if (paymentDetails.invoice_id)
            paymentDetailsData.invoiceId = paymentDetails.invoice_id;
          if ((paymentDetails.acquirer_data as any)?.account_type)
            paymentDetailsData.payerAccountType = (
              paymentDetails.acquirer_data as any
            ).account_type;
          if (paymentDetails.vpa) paymentDetailsData.vpa = paymentDetails.vpa;
          if (paymentDetails.card?.network)
            paymentDetailsData.cardNetwork = paymentDetails.card.network;
          if (paymentDetails.card?.last4)
            paymentDetailsData.cardLast4 = paymentDetails.card.last4;
          if (paymentDetails.bank)
            paymentDetailsData.bank = paymentDetails.bank;
          if (paymentDetails.wallet)
            paymentDetailsData.wallet = paymentDetails.wallet;

          if (Object.keys(paymentDetailsData).length > 0) {
            transaction.paymentDetails = paymentDetailsData;
          }

          // Extract fee details
          const feeDetailsData: any = {};
          if (paymentDetails.fee !== undefined)
            feeDetailsData.totalFee = paymentDetails.fee;
          if (
            paymentDetails.fee !== undefined &&
            paymentDetails.tax !== undefined
          ) {
            feeDetailsData.razorpayFee =
              paymentDetails.fee - paymentDetails.tax;
          }
          if (paymentDetails.tax !== undefined)
            feeDetailsData.gst = paymentDetails.tax;

          if (Object.keys(feeDetailsData).length > 0) {
            transaction.feeDetails = feeDetailsData;
          }
        } catch (fetchError) {
          console.error(
            'Error fetching payment details in webhook:',
            fetchError
          );
          // Continue even if fetching details fails
        }

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

/**
 * Get transaction details by transactionId
 */
export const getTransactionDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const userId = (req as any).jwtUser?.userId;

    if (!transactionId) {
      res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
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

    // Verify user owns this transaction (unless admin)
    const userRole = (req as any).jwtUser?.role;
    if (userRole !== 'admin' && transaction.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized to view this transaction',
      });
      return;
    }

    // Format amounts from paise to rupees for display
    const formatAmount = (amountInPaise?: number) =>
      amountInPaise ? (amountInPaise / 100).toFixed(2) : null;

    res.status(200).json({
      success: true,
      message: 'Transaction details retrieved successfully',
      data: {
        transactionId: transaction.transactionId,
        bookingId: transaction.bookingId,
        storyId: transaction.storyId,
        userId: transaction.userId,
        status: transaction.status,
        amount: formatAmount(transaction.amount),
        currency: transaction.currency,
        razorpayOrderId: transaction.razorpayOrderId,
        razorpayPaymentId: transaction.razorpayPaymentId,
        paymentDetails: transaction.paymentDetails
          ? {
              method: transaction.paymentDetails.method,
              bankRRN: transaction.paymentDetails.bankRRN,
              invoiceId: transaction.paymentDetails.invoiceId,
              payerAccountType: transaction.paymentDetails.payerAccountType,
              vpa: transaction.paymentDetails.vpa,
              cardNetwork: transaction.paymentDetails.cardNetwork,
              cardLast4: transaction.paymentDetails.cardLast4,
              bank: transaction.paymentDetails.bank,
              wallet: transaction.paymentDetails.wallet,
            }
          : null,
        feeDetails: transaction.feeDetails
          ? {
              totalFee: formatAmount(transaction.feeDetails.totalFee),
              razorpayFee: formatAmount(transaction.feeDetails.razorpayFee),
              gst: formatAmount(transaction.feeDetails.gst),
              serviceTax: formatAmount(transaction.feeDetails.serviceTax),
            }
          : null,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching transaction details:', error);
    newrelic.noticeError(error, {
      transactionId: req.params.transactionId || 'unknown',
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transaction details',
    });
  }
};

/**
 * Get all transactions for a booking
 */
export const getBookingTransactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).jwtUser?.userId;

    if (!bookingId) {
      res.status(400).json({
        success: false,
        message: 'Booking ID is required',
      });
      return;
    }

    // Find all transactions for this booking
    const transactions = await Transaction.find({ bookingId }).sort({
      createdAt: -1,
    });

    // Verify user owns this booking (check first transaction)
    const userRole = (req as any).jwtUser?.role;
    if (
      userRole !== 'admin' &&
      transactions.length > 0 &&
      transactions[0] &&
      transactions[0].userId !== userId
    ) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized to view these transactions',
      });
      return;
    }

    // Format amounts from paise to rupees
    const formatAmount = (amountInPaise?: number) =>
      amountInPaise ? (amountInPaise / 100).toFixed(2) : null;

    const formattedTransactions = transactions.map(transaction => ({
      transactionId: transaction.transactionId,
      bookingId: transaction.bookingId,
      storyId: transaction.storyId,
      status: transaction.status,
      amount: formatAmount(transaction.amount),
      currency: transaction.currency,
      razorpayOrderId: transaction.razorpayOrderId,
      razorpayPaymentId: transaction.razorpayPaymentId,
      paymentDetails: transaction.paymentDetails,
      feeDetails: transaction.feeDetails
        ? {
            totalFee: formatAmount(transaction.feeDetails.totalFee),
            razorpayFee: formatAmount(transaction.feeDetails.razorpayFee),
            gst: formatAmount(transaction.feeDetails.gst),
            serviceTax: formatAmount(transaction.feeDetails.serviceTax),
          }
        : null,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }));

    res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: {
        bookingId,
        transactions: formattedTransactions,
        count: transactions.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching booking transactions:', error);
    newrelic.noticeError(error, {
      bookingId: req.params.bookingId || 'unknown',
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transactions',
    });
  }
};
