# Razorpay Payment Integration - Production Grade

## Overview

Complete Razorpay payment integration for the Offbeat travel booking system with security-first architecture, webhook handling, and full transaction tracking.

## Architecture

### Models

- **Transaction Model** (`transactionsModel.ts`)
  - Stores complete payment lifecycle
  - Tracks Razorpay order IDs, payment IDs, and signatures
  - Supports transaction states: INITIATED → PENDING → SUCCESS/FAILED/REFUNDED
  - Indexed for high-performance queries

### Controllers

- **createRazorpayOrder**: Initializes payment with strict validation
- **verifyRazorpayPayment**: Client-side payment verification with HMAC signature
- **razorpayWebhookHandler**: Server-side webhook processing (production-safe, idempotent)

### Security Features

✅ **HMAC SHA256 signature verification** for all payment confirmations
✅ **Webhook signature validation** prevents unauthorized transaction updates
✅ **Idempotent updates** prevent duplicate processing
✅ **Server-side amount validation** - never trust client data
✅ **Environment-based credentials** with validation on startup

## Environment Variables

```env
# Required Razorpay Credentials
RZP_KEY_ID=rzp_test_xxxxxxxxxxxxx
RZP_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RZP_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

## API Endpoints

### 1. Create Order

**POST** `/api/transactions/create-order`

**Authentication**: Required (JWT)

**Request Body**:

```json
{
  "bookingId": "uuid-v4-booking-id",
  "storyId": "uuid-v4-story-id",
  "amount": 55000,
  "baseAmount": 50000,
  "discount": 1000,
  "travellers": [
    {
      "fullName": "John Doe",
      "emailAddress": "john@example.com",
      "phoneNumber": "+919876543210"
    }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "keyId": "rzp_test_xxxxx",
    "orderId": "order_xxxxxxxxxxxxx",
    "amount": 5500000,
    "currency": "INR",
    "transactionId": "uuid-v4-transaction-id"
  }
}
```

### 2. Verify Payment

**POST** `/api/transactions/verify`

**Authentication**: Required (JWT)

**Request Body**:

```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "generated_signature_hash",
  "transactionId": "uuid-v4-transaction-id"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "transactionId": "uuid-v4-transaction-id",
    "status": "SUCCESS"
  }
}
```

### 3. Webhook Handler

**POST** `/api/transactions/webhook`

**Authentication**: Signature-based (Razorpay webhook secret)

**Headers**:

```
x-razorpay-signature: webhook_signature_hash
```

**Handled Events**:

- `payment.captured` - Updates transaction and booking to SUCCESS

## Frontend Integration Example

```javascript
// 1. Create order
const orderResponse = await fetch('/api/transactions/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userToken}`,
  },
  body: JSON.stringify({
    bookingId,
    storyId,
    amount: 55000,
    baseAmount: 50000,
    discount: 1000,
    travellers: travellerDetails,
  }),
});

const { data } = await orderResponse.json();

// 2. Initialize Razorpay checkout
const options = {
  key: data.keyId,
  amount: data.amount,
  currency: data.currency,
  order_id: data.orderId,
  name: 'Offbeat Travel',
  description: 'Story Booking Payment',
  handler: async function (response) {
    // 3. Verify payment on backend
    const verifyResponse = await fetch('/api/transactions/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        transactionId: data.transactionId,
      }),
    });

    if (verifyResponse.ok) {
      // Payment successful - redirect to success page
      window.location.href = '/booking-success';
    }
  },
  prefill: {
    email: userEmail,
    contact: userPhone,
  },
};

const razorpay = new Razorpay(options);
razorpay.open();
```

## Webhook Configuration

1. **Login to Razorpay Dashboard**
2. **Navigate to**: Settings → Webhooks → Add New Webhook
3. **Webhook URL**: `https://your-domain.com/api/transactions/webhook`
4. **Active Events**: Select `payment.captured`
5. **Secret**: Copy and add to `RZP_WEBHOOK_SECRET` environment variable

## Transaction Lifecycle

```
INITIATED  → Order created, awaiting payment
    ↓
PENDING    → Payment initiated by user
    ↓
SUCCESS    → Payment captured and verified
    ↓
REFUNDED   → Payment refunded (manual/auto)

FAILED     → Signature mismatch or payment failure
```

## Security Best Practices

1. **Never expose `RZP_KEY_SECRET`** to client-side code
2. **Always validate webhook signatures** before processing
3. **Use HTTPS only** for production webhooks
4. **Implement idempotent updates** to prevent double-processing
5. **Log all transaction events** for audit trails
6. **Server-side validation** of all payment amounts

## Database Schema

```typescript
Transaction {
  transactionId: string (UUID)
  bookingId: string (ref: Booking)
  storyId: string
  userId: string

  razorpayOrderId: string (unique, indexed)
  razorpayPaymentId: string
  razorpaySignature: string

  amount: number (in paise)
  currency: string
  status: INITIATED | PENDING | SUCCESS | FAILED | REFUNDED

  meta: {
    baseAmount: number
    discount: number
    travellers: any[]
    paymentGateway: 'RAZORPAY'
  }

  createdAt: Date
  updatedAt: Date
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

**Common Error Codes**:

- `400` - Invalid request data
- `401` - Unauthorized (missing/invalid auth)
- `404` - Transaction/Booking not found
- `500` - Internal server error

## Production Checklist

- ✅ Environment variables configured
- ✅ Webhook URL registered in Razorpay dashboard
- ✅ HTTPS enabled for webhook endpoint
- ✅ Database indexes created
- ✅ NewRelic monitoring configured
- ✅ Error logging implemented
- ✅ Signature verification tested
- ✅ Idempotency tested with duplicate webhooks

## Testing

### Test Mode

- Use Razorpay test keys (`rzp_test_*`)
- Test cards: [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- Monitor transactions in Razorpay Test Dashboard

### Production Mode

- Switch to live keys (`rzp_live_*`)
- Update webhook URLs
- Enable two-factor authentication on Razorpay dashboard
- Set up alerts for failed payments

## Support

For Razorpay integration issues:

- Documentation: https://razorpay.com/docs/
- Support: https://razorpay.com/support/

For application issues:

- Check NewRelic error logs
- Review transaction status in database
- Verify webhook delivery in Razorpay dashboard
