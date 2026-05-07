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
    <div className="futuristic-pagination">
      <button 
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        className="nav-btn prev"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="pages-container">
        {pages.map((p, idx) => (
          <React.Fragment key={idx}>
            {p === '...' ? (
              <span className="dots">...</span>
            ) : (
              <button
                onClick={() => onPageChange(p)}
                className={`page-btn ${current === p ? 'active' : ''}`}
              >
                <span className="btn-content">{p}</span>
                {current === p && <span className="active-glow"></span>}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      <button 
        onClick={() => onPageChange(current + 1)}
        disabled={current === total}
        className="nav-btn next"
      >
        <ChevronRight size={18} />
      </button>

      <style>{`
        .futuristic-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-top: 50px;
          padding: 20px;
          user-select: none;
        }

        .pages-container {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.02);
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .page-btn {
          position: relative;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-dim);
          font-family: var(--font-heading);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border-radius: 8px;
          overflow: hidden;
        }

        .page-btn .btn-content {
          position: relative;
          z-index: 2;
        }

        .page-btn:hover:not(.active) {
          color: white;
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .page-btn.active {
          color: white;
          background: var(--cta);
          border-color: var(--cta);
          box-shadow: 0 0 20px var(--cta-glow);
          transform: scale(1.05);
        }

        .active-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          animation: scan 2s linear infinite;
        }

        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .nav-btn {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--cta);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-btn:hover:not(:disabled) {
          background: var(--cta);
          color: white;
          box-shadow: 0 0 15px var(--cta-glow);
          border-color: var(--cta);
        }

        .nav-btn:disabled {
          opacity: 0.2;
          cursor: not-allowed;
        }

        .dots {
          color: var(--text-dim);
          font-weight: bold;
          padding: 0 10px;
          letter-spacing: 2px;
        }

        @media (max-width: 600px) {
          .futuristic-pagination {
            gap: 10px;
          }
          .page-btn, .nav-btn {
            width: 36px;
            height: 36px;
            font-size: 0.75rem;
          }
          .pages-container {
            padding: 4px;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default Pagination;
