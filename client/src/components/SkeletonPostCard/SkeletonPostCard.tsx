import React from 'react';
import './SkeletonPostCard.css';

const SkeletonPostCard: React.FC = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image skeleton-pulse"></div>
      <div className="skeleton-content">
        <div className="skeleton-text skeleton-title skeleton-pulse"></div>
        <div className="skeleton-text skeleton-pulse" style={{ width: '90%' }}></div>
        <div className="skeleton-text skeleton-pulse" style={{ width: '70%' }}></div>
        <div className="skeleton-text skeleton-pulse" style={{ width: '60%' }}></div>
        <div className="skeleton-meta">
           <div className="skeleton-meta-item skeleton-pulse"></div>
           <div className="skeleton-meta-item skeleton-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonPostCard;