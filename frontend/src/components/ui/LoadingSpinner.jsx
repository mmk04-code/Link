import React from 'react';
import './ui.css';

const LoadingSpinner = ({ size = 40 }) => (
  <div className="ui-loading-spinner-wrapper">
    <div
      className="ui-loading-spinner"
      style={{ width: size, height: size }}
    />
  </div>
);

export default LoadingSpinner;
