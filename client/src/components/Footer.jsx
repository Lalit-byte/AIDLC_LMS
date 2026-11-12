import React from 'react';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">OpenLMS Platform</div>
        <p className="footer-copy">
          &copy; {CURRENT_YEAR} OpenLMS. Built with React + Vite & Node.js + Express.
        </p>
      </div>
    </footer>
  );
}
