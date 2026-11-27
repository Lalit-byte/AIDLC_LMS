import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiX, FiAlertTriangle, FiInfo, FiCheckCircle, FiZap, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/useAuth';
import { api } from '../../services/api';
import './CheckoutModal.css';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutModal({ course, onClose }) {
  const price = typeof course?.price === 'number' ? course.price : Number(course?.price || 0);
  const isFree = price === 0;
  const targetId = course?._id || course?.id || course?.slug;
  const instructorDisplay =
    typeof course?.instructor === 'object'
      ? course?.instructor?.name || course?.instructorName || 'Instructor'
      : course?.instructorName || course?.instructor || 'Instructor';

  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [gatewayKeyId, setGatewayKeyId] = useState('');
  const [keyChecked, setKeyChecked] = useState(isFree);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isFree) return undefined;
    let active = true;
    api.getRazorpayKey()
      .then((k) => {
        if (!active) return;
        setGatewayKeyId(k || '');
        setKeyChecked(true);
      })
      .catch(() => {
        if (active) setKeyChecked(true);
      });
    return () => {
      active = false;
    };
  }, [isFree]);

  const handleConfirm = async (forceSimulate = false) => {
    setError('');
    setProcessing(true);
    try {
      if (isFree) {
        await api.enrollFreeCourse(targetId);
        setCompleted(true);
        setProcessing(false);
        return;
      }

      const orderRes = await api.createPaymentOrder(targetId);
      const { orderId, amount, currency, keyId } = orderRes.data || {};

      const isPlaceholderKey = !keyId || keyId.includes('placeholder');
      const isSimulatedOrder = typeof orderId === 'string' && orderId.startsWith('order_sim_');

      if (!forceSimulate && (isPlaceholderKey || isSimulatedOrder)) {
        setError(
          'Razorpay test keys are not configured in server/.env (currently set to rzp_test_placeholder). Please add your RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in server/.env and restart the server to open the Razorpay payment window, or click "Instant Sandbox Test Payment" below to test without keys.'
        );
        setProcessing(false);
        return;
      }

      if (forceSimulate || isSimulatedOrder || isPlaceholderKey) {
        const verifyRes = await api.verifyCheckout({
          orderId,
          paymentId: `pay_sim_${Date.now()}`,
          signature: 'simulated_signature'
        });
        setPaymentInfo({
          orderId,
          paymentId: verifyRes.data?.paymentId || `pay_sim_${Date.now()}`
        });
        setCompleted(true);
        setProcessing(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Unable to reach Razorpay gateway. Please check your internet connection or use Sandbox mode.');
      }

      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'OpenLMS Platform',
        description: course.title,
        order_id: orderId,
        handler: async (response) => {
          try {
            setProcessing(true);
            await api.verifyCheckout({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
            setPaymentInfo({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id
            });
            setCompleted(true);
          } catch (err) {
            setError(err.message || 'Payment verification failed.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        notes: {
          courseId: targetId
        },
        theme: {
          color: '#781F00'
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', (failRes) => {
        setError(failRes?.error?.description || 'Payment was declined or cancelled.');
        setProcessing(false);
      });
      razorpayInstance.open();
    } catch (err) {
      setError(err.message || 'Enrollment failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleStartLearning = () => {
    onClose();
    navigate(`/learn/${targetId}`);
  };

  const handleGoToDashboard = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>
            {completed
              ? 'Enrollment Confirmed'
              : isFree
              ? 'Confirm Free Enrollment'
              : 'Checkout with Razorpay'}
          </h3>
          {!processing && (
            <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              <FiX size={18} />
            </button>
          )}
        </div>

        <div className="modal-body">
          {completed ? (
            <div className="success-state">
              <div className="success-icon-circle">
                <FiCheckCircle size={26} aria-hidden="true" />
              </div>
              <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                You&apos;re officially enrolled!
              </h4>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                You now have full, lifetime access to <strong>{course.title}</strong>.
              </p>

              {paymentInfo && (
                <div className="checkout-receipt-badge">
                  <div>
                    <strong>Order:</strong> <code>{paymentInfo.orderId}</code>
                  </div>
                  <div>
                    <strong>Payment ID:</strong> <code>{paymentInfo.paymentId}</code>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={handleStartLearning}>
                  <span>Start Learning Now</span>
                  <FiArrowRight size={15} aria-hidden="true" />
                </button>
                <button type="button" className="btn btn-outline" style={{ width: '100%' }} onClick={handleGoToDashboard}>
                  Go to My Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="checkout-error-box">
                  <FiAlertTriangle size={16} style={{ marginRight: '0.5rem', flexShrink: 0, marginTop: '2px' }} />
                  <span>{error}</span>
                </div>
              )}

              <div className="order-summary">
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Course:</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{course.title}</span>
                </div>
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Instructor:</span>
                  <span>{instructorDisplay}</span>
                </div>
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Access:</span>
                  <span>Lifetime &bull; Certificate</span>
                </div>
                <div className="summary-row total tabular-nums">
                  <span>Total Amount:</span>
                  <span style={{ color: isFree ? 'var(--color-success)' : 'var(--color-secondary)' }}>
                    {isFree ? 'Free (₹0)' : `₹${price.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              {!isFree && (
                <div className="gateway-badge">
                  <FiLock size={15} aria-hidden="true" />
                  <span>
                    Secured by <strong>Razorpay</strong> (UPI, Cards, Netbanking)
                  </span>
                </div>
              )}

              {!isFree && keyChecked && (!gatewayKeyId || gatewayKeyId.includes('placeholder')) && (
                <div className="checkout-keys-notice">
                  <div className="checkout-keys-title">
                    <FiInfo size={15} aria-hidden="true" />
                    <span>
                      Razorpay keys not yet set in <code>server/.env</code>
                    </span>
                  </div>
                  <p className="checkout-keys-copy">
                    To open the real Razorpay popup, add your <code>RAZORPAY_KEY_ID</code> and{' '}
                    <code>RAZORPAY_KEY_SECRET</code> into <code>server/.env</code> and restart the server. Or use the
                    Instant Sandbox button below to test.
                  </p>
                </div>
              )}

              {!isAuthenticated ? (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                    You must be logged in to enroll in this course.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      onClose();
                      navigate('/login');
                    }}
                  >
                    Log in to Enroll
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={processing}
                    onClick={() => handleConfirm(false)}
                  >
                    {processing
                      ? 'Opening Gateway...'
                      : isFree
                      ? 'Confirm Free Enrollment'
                      : `Pay ₹${price.toLocaleString('en-IN')} with Razorpay`}
                  </button>

                  {!isFree && (
                    <button
                      type="button"
                      className="checkout-sandbox-btn"
                      disabled={processing}
                      onClick={() => handleConfirm(true)}
                    >
                      <FiZap size={14} aria-hidden="true" />
                      <span>Instant Sandbox Test Payment (Simulate)</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
