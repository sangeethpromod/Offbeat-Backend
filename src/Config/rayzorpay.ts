import Razorpay from 'razorpay';

// Validate required environment variables
const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RZP_KEY_ID || !RZP_KEY_SECRET) {
  throw new Error(
    'Razorpay credentials missing: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables'
  );
}

// Initialize Razorpay client
const razorpayClient = new Razorpay({
  key_id: RZP_KEY_ID,
  key_secret: RZP_KEY_SECRET,
});

// Export as non-null strings (validated above)
export { razorpayClient, RZP_KEY_ID };
export const RZP_KEY_SECRET_SAFE = RZP_KEY_SECRET as string;

// Webhook secret for signature verification
const RZP_WEBHOOK_SECRET_ENV = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!RZP_WEBHOOK_SECRET_ENV) {
  console.warn(
    'WARNING: RAZORPAY_WEBHOOK_SECRET not set. Webhook signature verification will fail.'
  );
}

export const RZP_WEBHOOK_SECRET = RZP_WEBHOOK_SECRET_ENV || '';
