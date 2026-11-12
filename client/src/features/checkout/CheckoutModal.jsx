import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CheckoutModal.css';

export default function CheckoutModal({ course, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  const isFree = course.price === 0;

  const handleConfirm = () => {
    setProcessing(true);
    // shortcut: Simulate Razorpay checkout verification; replace with real Razorpay window in Phase 2
    setTimeout(() => {
      setProcessing(false);
      setCompleted(true);
    }, 1200);
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
              <div className="order-summary">
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-muted)' }}>Course:</span>
                  <span style={{ fontWeight: 600 }}>{course.title}</span>
                </div>
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-muted)' }}>Instructor:</span>
                  <span>{course.instructor}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>{isFree ? 'Free (₹0)' : `₹${course.price.toLocaleString('en-IN')}`}</span>
                </div>
              </div>

              {!isFree && (
                <div className="gateway-badge">
                  <span>🔒</span>
                  <span>Secured by <strong>Razorpay</strong> (Test Mode Simulation)</span>
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={processing}
                onClick={handleConfirm}
              >
                {processing
                  ? 'Verifying Enrollment...'
                  : isFree
                  ? 'Confirm Enrollment'
                  : `Pay ₹${course.price.toLocaleString('en-IN')} with Razorpay`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
