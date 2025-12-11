import Razorpay from 'razorpay';

// Validate required environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

console.log('Razorpay Config Debug:', {
  hasKeyId: !!RAZORPAY_KEY_ID,
  hasKeySecret: !!RAZORPAY_KEY_SECRET,
  keyIdPrefix: RAZORPAY_KEY_ID
    ? RAZORPAY_KEY_ID.substring(0, 10) + '...'
    : 'missing',
  envKeys: Object.keys(process.env).filter(k => k.includes('RAZOR')),
});

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error(
    'Razorpay credentials missing: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables'
  );
}

// Initialize Razorpay client
const razorpayClient = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Webhook secret for signature verification
const RAZORPAY_WEBHOOK_SECRET_ENV = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!RAZORPAY_WEBHOOK_SECRET_ENV) {
  console.warn(
    'WARNING: RAZORPAY_WEBHOOK_SECRET not set. Webhook signature verification will fail.'
  );
}

// Export as non-null strings (validated above)
// Use type assertion for exports since we've validated they exist
export { razorpayClient };
export const RAZORPAY_KEY_ID_SAFE = RAZORPAY_KEY_ID as string;
export const RAZORPAY_KEY_SECRET_SAFE = RAZORPAY_KEY_SECRET as string;
export const RAZORPAY_WEBHOOK_SECRET = RAZORPAY_WEBHOOK_SECRET_ENV || '';
