import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import './SearchBar.css';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  ariaLabel,
  className = ''
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && value) {
      e.preventDefault();
      onChange('');
    }
  };

  return (
    <div className={`studio-searchbar ${className}`.trim()}>
      <FiSearch size={16} className="studio-searchbar-icon" aria-hidden="true" />
      <input
        type="search"
        className="studio-searchbar-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
      />
      {value && (
        <button
          type="button"
          className="studio-searchbar-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <FiX size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
