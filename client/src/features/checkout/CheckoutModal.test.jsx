import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/authContextBase.js';
import CheckoutModal from './CheckoutModal.jsx';

describe('CheckoutModal Component', () => {
  it('renders free course confirmation when course price is 0', () => {
    const mockAuth = {
      user: { name: 'Alice Student', email: 'alice@test.com' },
      isAuthenticated: true,
      loading: false
    };

    const course = {
      _id: 'c_free',
      title: 'Free Web Dev 101',
      price: 0,
      instructorName: 'Sarah Connor'
    };

    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <CheckoutModal course={course} onClose={() => {}} />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(html).toContain('Confirm Free Enrollment');
    expect(html).toContain('Free (₹0)');
    expect(html).toContain('Free Web Dev 101');
    expect(html).not.toContain('Secured by');
  });

  it('renders Razorpay checkout summary and payment buttons for paid course', () => {
    const mockAuth = {
      user: { name: 'Bob Buyer', email: 'bob@test.com' },
      isAuthenticated: true,
      loading: false
    };

    const course = {
      _id: 'c_paid',
      title: 'Fullstack Next.js Masterclass',
      price: 499,
      instructor: { name: 'Alex Instructor' }
    };

    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <CheckoutModal course={course} onClose={() => {}} />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(html).toContain('Checkout with Razorpay');
    expect(html).toContain('Fullstack Next.js Masterclass');
    expect(html).toContain('₹499');
    expect(html).toContain('Secured by');
    expect(html).toContain('Pay ₹499 with Razorpay');
    expect(html).toContain('Instant Sandbox Test Payment');
  });

  it('renders login prompt when unauthenticated user attempts checkout', () => {
    const mockAuth = {
      user: null,
      isAuthenticated: false,
      loading: false
    };

    const course = {
      _id: 'c_paid',
      title: 'Paid Course',
      price: 999
    };

    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <CheckoutModal course={course} onClose={() => {}} />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(html).toContain('You must be logged in to enroll');
    expect(html).toContain('Log in to Enroll');
  });
});
