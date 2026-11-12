import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">OpenLMS Platform</div>
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} OpenLMS. Built with React + Vite & Node.js + Express.
        </p>
      </div>
    </footer>
  );
}
