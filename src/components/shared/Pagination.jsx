import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ current, total, onPageChange }) => {
  if (total <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;
    
    if (total <= showMax) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);
      
      if (current <= 3) {
        end = 4;
      } else if (current >= total - 2) {
        start = total - 3;
      }
      
      if (start > 2) pages.push('...');
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < total - 1) pages.push('...');
      
      pages.push(total);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="pagination-container" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '10px', 
      marginTop: '40px',
      padding: '20px 0'
    }}>
      <button 
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        className="pagination-btn arrow-btn"
        style={{ 
          opacity: current === 1 ? 0.3 : 1,
          cursor: current === 1 ? 'not-allowed' : 'pointer'
        }}
      >
        <ChevronLeft size={20} />
      </button>

      {pages.map((p, idx) => (
        <React.Fragment key={idx}>
          {p === '...' ? (
            <span style={{ color: 'var(--text-dim)', padding: '0 5px' }}>...</span>
          ) : (
            <button
              onClick={() => onPageChange(p)}
              className={`pagination-btn ${current === p ? 'active' : ''}`}
            >
              {p}
            </button>
          )}
        </React.Fragment>
      ))}

      <button 
        onClick={() => onPageChange(current + 1)}
        disabled={current === total}
        className="pagination-btn arrow-btn"
        style={{ 
          opacity: current === total ? 0.3 : 1,
          cursor: current === total ? 'not-allowed' : 'pointer'
        }}
      >
        <ChevronRight size={20} />
      </button>

      <style>{`
        .pagination-btn {
          width: 40px;
          height: 40px;
          display: flex;
          alignItems: center;
          justify-content: center;
          background: var(--secondary);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--cta);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.9rem;
          border-radius: 8px !important; /* Overriding global 0px for this specific premium component as per image */
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: var(--cta);
          background: rgba(37, 99, 235, 0.1);
          transform: translateY(-2px);
        }

        .pagination-btn.active {
          background: var(--cta);
          color: white;
          border-color: var(--cta);
          box-shadow: 0 4px 15px var(--cta-glow);
        }

        .arrow-btn {
          background: transparent;
          border-color: transparent;
        }
        
        .arrow-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          border-color: transparent;
        }

        @media (max-width: 480px) {
          .pagination-container {
            gap: 5px;
          }
          .pagination-btn {
            width: 35px;
            height: 35px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Pagination;
