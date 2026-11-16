import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [gatewayKeyId, setGatewayKeyId] = useState('');
  const [keyChecked, setKeyChecked] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const price = typeof course?.price === 'number' ? course.price : Number(course?.price || 0);
  const isFree = price === 0;
  const targetId = course?._id || course?.id || course?.slug;
  const instructorDisplay =
    typeof course?.instructor === 'object'
      ? course?.instructor?.name || course?.instructorName || 'Instructor'
      : course?.instructorName || course?.instructor || 'Instructor';

  useEffect(() => {
    let active = true;
    if (!isFree) {
      api.getRazorpayKey()
        .then((k) => {
          if (!active) return;
          setGatewayKeyId(k || '');
          setKeyChecked(true);
        })
        .catch(() => {
          if (active) setKeyChecked(true);
        });
    } else {
      setKeyChecked(true);
    }
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

      // Step 1: Create backend order
      const orderRes = await api.createPaymentOrder(targetId);
      const { orderId, amount, currency, keyId } = orderRes.data || {};

      const isPlaceholderKey = !keyId || keyId.includes('placeholder');
      const isSimulatedOrder = typeof orderId === 'string' && orderId.startsWith('order_sim_');

      // If user clicked standard "Pay with Razorpay" but keys are not configured yet
      if (!forceSimulate && (isPlaceholderKey || isSimulatedOrder)) {
        setError(
          'Razorpay test keys are not configured in server/.env (currently set to rzp_test_placeholder). Please add your RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in server/.env and restart the server to open the Razorpay payment window, or click "⚡ Instant Sandbox Test Payment" below to test without keys.'
        );
        setProcessing(false);
        return;
      }

      // If test simulation was explicitly requested or fallback
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

      // Step 2: Real Razorpay Checkout flow
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Unable to reach Razorpay gateway. Please check your internet connection or use Sandbox mode.');
      }

      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'OpenLMS Platform',
        description: course.title,
        order_id: orderId,
        handler: async (response) => {
          try {
            setProcessing(true);
            const verifyRes = await api.verifyCheckout({
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
          color: '#2563eb'
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {completed
              ? 'Enrollment Confirmed'
              : isFree
              ? 'Confirm Free Enrollment'
              : 'Checkout with Razorpay'}
          </h3>
          {!processing && (
            <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          )}
        </div>

        <div className="modal-body">
          {completed ? (
            <div className="success-state">
              <div className="success-icon">🎉</div>
              <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                You're officially enrolled!
              </h4>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                You now have full, lifetime access to <strong>{course.title}</strong>.
              </p>

              {paymentInfo && (
                <div className="checkout-receipt-badge">
                  <div><strong>Order:</strong> <code>{paymentInfo.orderId}</code></div>
                  <div><strong>Payment ID:</strong> <code>{paymentInfo.paymentId}</code></div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleStartLearning}>
                  Start Learning Now ➔
                </button>
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleGoToDashboard}>
                  Go to My Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="checkout-error-box">
                  <span style={{ marginRight: '0.5rem' }}>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="order-summary">
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-muted)' }}>Course:</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{course.title}</span>
                </div>
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-muted)' }}>Instructor:</span>
                  <span>{instructorDisplay}</span>
                </div>
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-muted)' }}>Access:</span>
                  <span>Lifetime &bull; Certificate</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span style={{ color: isFree ? '#10b981' : 'var(--color-primary, #2563eb)' }}>
                    {isFree ? 'Free (₹0)' : `₹${price.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              {!isFree && (
                <div className="gateway-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>Secured by <strong>Razorpay</strong> (UPI, Cards, Netbanking)</span>
                </div>
              )}

              {!isFree && keyChecked && (!gatewayKeyId || gatewayKeyId.includes('placeholder')) && (
                <div className="checkout-keys-notice">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#92400e', marginBottom: '0.2rem' }}>
                    <span>ℹ️</span>
                    <span>Razorpay keys not yet set in <code>server/.env</code></span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#78350f', lineHeight: 1.4 }}>
                    To open the real Razorpay popup, add your <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> into <code>server/.env</code> and restart the server. Or use the Instant Sandbox button below to test.
                  </p>
                </div>
              )}

              {!isAuthenticated ? (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                    You must be logged in to enroll in this course.
                  </p>
                  <button
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
                      ⚡ Instant Sandbox Test Payment (Simulate)
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
