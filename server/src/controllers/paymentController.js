import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Payment } from '../models/Payment.js';
import { Enrollment } from '../models/Enrollment.js';
import { getRazorpayClient, verifyCheckoutSignature } from '../config/razorpay.js';
import { ApiError } from '../utils/ApiError.js';

export async function createPaymentOrder(req, res, next) {
  try {
    const { courseId } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw ApiError.badRequest('Valid courseId is required.');
    }

    // Always fetch authoritative price from database; never trust client amount
    const course = await Course.findById(courseId);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    if (course.status !== 'published') {
      throw ApiError.badRequest('This course is not currently available for purchase.');
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user.id,
      course: course._id,
      status: 'active'
    });

    if (existingEnrollment) {
      throw ApiError.badRequest('You are already enrolled in this course.');
    }

    if (course.price === 0) {
      throw ApiError.badRequest('This course is free. Please enroll directly without payment.');
    }

    // Amount in Razorpay subunits (paise)
    const amountInSubunits = Math.round(course.price * 100);
    const razorpay = getRazorpayClient();

    const orderOptions = {
      amount: amountInSubunits,
      currency: course.currency || 'INR',
      receipt: `rcpt_${Date.now()}_${req.user.id.slice(-6)}`,
      notes: {
        userId: req.user.id.toString(),
        courseId: course._id.toString(),
        courseTitle: course.title
      }
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Persist pending payment record
    await Payment.create({
      orderId: razorpayOrder.id,
      user: req.user.id,
      course: course._id,
      amount: course.price,
      currency: course.currency || 'INR',
      status: 'created'
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        course: {
          id: course._id,
          title: course.title,
          price: course.price
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyCheckout(req, res, next) {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      throw ApiError.badRequest('orderId, paymentId, and signature are required for checkout verification.');
    }

    const isValidSignature = verifyCheckoutSignature({
      orderId,
      paymentId,
      signature
    });

    if (!isValidSignature) {
      // Mark payment failed if found
      await Payment.findOneAndUpdate(
        { orderId },
        { status: 'failed', errorDetails: 'Invalid payment signature' }
      );
      throw ApiError.badRequest('Invalid payment signature. Verification failed.');
    }

    // Update payment record to paid
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      throw ApiError.notFound('Payment order record not found.');
    }

    payment.paymentId = paymentId;
    payment.signature = signature;
    payment.status = 'paid';
    await payment.save();

    // Activate enrollment idempotently
    const enrollment = await Enrollment.findOneAndUpdate(
      { user: payment.user, course: payment.course },
      {
        user: payment.user,
        course: payment.course,
        payment: payment._id,
        status: 'active',
        enrolledAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      data: {
        message: 'Payment verified and enrollment activated.',
        enrollmentId: enrollment._id,
        courseId: payment.course,
        orderId: payment.orderId,
        paymentId: payment.paymentId
      }
    });
  } catch (err) {
    next(err);
  }
}

export function getRazorpayKey(req, res) {
  res.json({
    success: true,
    data: {
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    }
  });
}
