import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import Footer from './Footer.jsx';

describe('Footer component', () => {
  it('renders OpenLMS branding and copyright year', () => {
    const html = renderToString(<Footer />);
    expect(html).toContain('OpenLMS Platform');
    expect(html).toContain(String(new Date().getFullYear()));
  });
});
