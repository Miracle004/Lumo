import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Access Denied / Page Not Found</h2>
        <p className="not-found-text">
          You do not have permission to access this resource, or the page you are looking for does not exist.
        </p>
        <Link to="/" className="not-found-home-link">
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
