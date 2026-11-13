import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance = null;

export function getRazorpayClient() {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder';

    razorpayInstance = new Razorpay({
      key_id,
      key_secret
    });
  }
  return razorpayInstance;
}

export function setRazorpayClient(mockClient) {
  razorpayInstance = mockClient;
}

/**
 * Verifies Razorpay checkout payment signature using timing-safe comparison.
 * Signature format: HMAC-SHA256(order_id + "|" + payment_id, secret)
 */
export function verifyCheckoutSignature({ orderId, paymentId, signature, secret = process.env.RAZORPAY_KEY_SECRET }) {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const effectiveSecret = secret || 'rzp_test_secret_placeholder';
  const text = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac('sha256', effectiveSecret)
    .update(text)
    .digest('hex');

  const generatedBuffer = Buffer.from(generatedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (generatedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
}

/**
 * Verifies Razorpay webhook signature using raw payload buffer and timing-safe comparison.
 * Signature format: HMAC-SHA256(rawBody, webhookSecret)
 * @param {Object} params
 * @param {Buffer|string} params.rawBody - Raw request payload buffer or string
 * @param {string} params.signature - Signature from 'x-razorpay-signature' header
 * @param {string} [params.secret] - Razorpay webhook secret
 * @returns {boolean}
 */
export function verifyWebhookSignature({ rawBody, signature, secret = process.env.RAZORPAY_WEBHOOK_SECRET }) {
  if (!rawBody || !signature) {
    return false;
  }

  const effectiveSecret = secret || 'rzp_webhook_secret_placeholder';
  const generatedSignature = crypto
    .createHmac('sha256', effectiveSecret)
    .update(rawBody)
    .digest('hex');

  const generatedBuffer = Buffer.from(generatedSignature, 'utf8');
  const receivedBuffer = Buffer.from(signature, 'utf8');

  if (generatedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
}
