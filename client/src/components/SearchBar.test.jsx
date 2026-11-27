import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import SearchBar from './SearchBar.jsx';

describe('SearchBar component', () => {
  it('renders search input without clear button when value is empty', () => {
    const html = renderToString(
      <SearchBar value="" onChange={() => {}} placeholder="Search courses..." />
    );

    expect(html).toContain('type="search"');
    expect(html).toContain('placeholder="Search courses..."');
    expect(html).not.toContain('aria-label="Clear search"');
  });

  it('renders clear button when value is non-empty', () => {
    const html = renderToString(
      <SearchBar
        value="react"
        onChange={() => {}}
        placeholder="Search courses..."
        ariaLabel="Search published courses"
      />
    );

    expect(html).toContain('value="react"');
    expect(html).toContain('aria-label="Search published courses"');
    expect(html).toContain('aria-label="Clear search"');
  });
});
