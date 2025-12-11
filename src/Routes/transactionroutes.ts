import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhookHandler,
  getTransactionDetails,
  getBookingTransactions,
} from '../Controller/Payment/rayzorPayController';
import { verifyAccessToken } from '../Middleware/tokenManagement';

const transactionRoutes = Router();

/**
 * Async handler wrapper for clean error handling
 */
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * POST /api/transactions/create-order
 * Create a Razorpay order and initialize transaction
 * Protected: Requires authentication
 */
transactionRoutes.post(
  '/create-order',
  verifyAccessToken,
  asyncHandler(createRazorpayOrder)
);

/**
 * POST /api/transactions/verify
 * Verify Razorpay payment signature and update transaction
 * Protected: Requires authentication
 */
transactionRoutes.post(
  '/verify',
  verifyAccessToken,
  asyncHandler(verifyRazorpayPayment)
);

/**
 * POST /api/transactions/webhook
 * Razorpay webhook endpoint for payment events
 * Public: Signature validation done in controller
 * CRITICAL: Must use raw body for signature verification
 */
transactionRoutes.post(
  '/webhook',
  express.json({
    type: '*/*',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  }),
  asyncHandler(razorpayWebhookHandler)
);

/**
 * GET /api/transactions/:transactionId
 * Get detailed transaction information including payment method, fees, etc.
 * Protected: Requires authentication
 */
transactionRoutes.get(
  '/:transactionId',
  verifyAccessToken,
  asyncHandler(getTransactionDetails)
);

/**
 * GET /api/transactions/booking/:bookingId
 * Get all transactions for a specific booking
 * Protected: Requires authentication
 */
transactionRoutes.get(
  '/booking/:bookingId',
  verifyAccessToken,
  asyncHandler(getBookingTransactions)
);

export default transactionRoutes;
