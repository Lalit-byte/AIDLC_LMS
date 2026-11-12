import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, 'Razorpay order ID is required'],
      unique: true,
      index: true,
      trim: true
    },
    paymentId: {
      type: String,
      default: '',
      trim: true,
      index: true
    },
    signature: {
      type: String,
      default: '',
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount must be non-negative']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    status: {
      type: String,
      enum: ['created', 'attempted', 'paid', 'failed'],
      default: 'created',
      index: true
    },
    errorDetails: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
