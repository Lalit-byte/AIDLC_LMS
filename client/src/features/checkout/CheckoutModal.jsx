import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { api } from '../../services/api';
import './CheckoutModal.css';

export default function CheckoutModal({ course, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const price = typeof course?.price === 'number' ? course.price : Number(course?.price || 0);
  const isFree = price === 0;
  const instructorDisplay =
    typeof course?.instructor === 'object'
      ? course?.instructor?.name || course?.instructorName || 'Instructor'
      : course?.instructorName || course?.instructor || 'Instructor';

  const handleConfirm = async () => {
    setError('');
    setProcessing(true);
    try {
      const targetId = course?._id || course?.id || course?.slug;
      if (isFree) {
        await api.enrollFreeCourse(targetId);
      } else {
        const orderRes = await api.createPaymentOrder(targetId);
        const orderId = orderRes.data?.orderId;
        await api.verifyCheckout({
          orderId,
          paymentId: `pay_sim_${Date.now()}`,
          signature: 'simulated_signature'
        });
      }
      setCompleted(true);
    } catch (err) {
      setError(err.message || 'Enrollment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGoToDashboard = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{completed ? 'Enrollment Confirmed' : isFree ? 'Confirm Free Enrollment' : 'Checkout with Razorpay'}</h3>
          {!processing && (
            <button className="modal-close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <div className="modal-body">
          {completed ? (
            <div className="success-state">
              <div className="success-icon">🎉</div>
              <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>You're in!</h4>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                You have successfully enrolled in <strong>{course.title}</strong>.
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleGoToDashboard}>
                Go to My Learning
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ color: 'var(--color-danger, #ef4444)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <div className="order-summary">
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-muted)' }}>Course:</span>
                  <span style={{ fontWeight: 600 }}>{course.title}</span>
                </div>
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-muted)' }}>Instructor:</span>
                  <span>{instructorDisplay}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>{isFree ? 'Free (₹0)' : `₹${price.toLocaleString('en-IN')}`}</span>
                </div>
              </div>

              {!isFree && (
                <div className="gateway-badge">
                  <span>🔒</span>
                  <span>Secured by <strong>Razorpay</strong> (Test Mode Simulation)</span>
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
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={processing}
                  onClick={handleConfirm}
                >
                  {processing
                    ? 'Processing Enrollment...'
                    : isFree
                    ? 'Confirm Enrollment'
                    : `Pay ₹${price.toLocaleString('en-IN')} with Razorpay`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
