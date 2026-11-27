import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Pagination.css';

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) pages.push('ellipsis-left');
  for (let p = left; p <= right; p += 1) {
    pages.push(p);
  }
  if (right < totalPages - 1) pages.push('ellipsis-right');
  pages.push(totalPages);

  return pages;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'items',
  className = ''
}) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);
  const pageNumbers = getPageNumbers(safePage, totalPages);

  return (
    <nav
      className={`studio-pagination ${className}`.trim()}
      aria-label={`${itemLabel} pagination`}
    >
      <span className="pagination-summary tabular-nums">
        Showing <strong>{startItem}&ndash;{endItem}</strong> of <strong>{totalItems}</strong> {itemLabel}
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn pagination-nav-btn"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <FiChevronLeft size={15} aria-hidden="true" />
          <span>Previous</span>
        </button>

        <div className="pagination-pages">
          {pageNumbers.map((entry) =>
            typeof entry === 'string' ? (
              <span key={entry} className="pagination-ellipsis" aria-hidden="true">
                &hellip;
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                className={`pagination-btn pagination-page-btn tabular-nums ${
                  entry === safePage ? 'active' : ''
                }`}
                aria-current={entry === safePage ? 'page' : undefined}
                onClick={() => onPageChange(entry)}
              >
                {entry}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className="pagination-btn pagination-nav-btn"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          <span>Next</span>
          <FiChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
