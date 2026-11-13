import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, 'Webhook event ID is required'],
      unique: true,
      index: true,
      trim: true
    },
    event: {
      type: String,
      required: [true, 'Webhook event type is required'],
      trim: true
    },
    orderId: {
      type: String,
      index: true,
      trim: true,
      default: ''
    },
    paymentId: {
      type: String,
      index: true,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['processed', 'ignored', 'failed'],
      default: 'processed'
    }
  },
  {
    timestamps: true
  }
);

export const WebhookEvent =
  mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', webhookEventSchema);
