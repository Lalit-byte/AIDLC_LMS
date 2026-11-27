import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import Pagination from './Pagination.jsx';
import { paginateItems } from './paginationUtils.js';

describe('Pagination helper & component', () => {
  it('paginateItems slices items and clamps out-of-range pages', () => {
    const data = Array.from({ length: 23 }, (_, i) => i + 1);

    const p1 = paginateItems(data, 1, 10);
    expect(p1.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(p1.currentPage).toBe(1);
    expect(p1.totalPages).toBe(3);
    expect(p1.startItem).toBe(1);
    expect(p1.endItem).toBe(10);

    const pClamped = paginateItems(data, 99, 10);
    expect(pClamped.currentPage).toBe(3);
    expect(pClamped.items).toEqual([21, 22, 23]);
    expect(pClamped.startItem).toBe(21);
    expect(pClamped.endItem).toBe(23);
  });

  it('renders nothing when totalItems fits on a single page', () => {
    const html = renderToString(
      <Pagination currentPage={1} totalItems={8} pageSize={10} onPageChange={() => {}} />
    );
    expect(html).toBe('');
  });

  it('renders range summary, page buttons, and ellipsis for large page counts', () => {
    const html = renderToString(
      <Pagination
        currentPage={5}
        totalItems={100}
        pageSize={10}
        onPageChange={() => {}}
        itemLabel="users"
      />
    );

    expect(html).toContain('41');
    expect(html).toContain('50');
    expect(html).toContain('100');
    expect(html).toContain('users');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('Previous');
    expect(html).toContain('Next');
    expect(html).toContain('…');
  });
});
