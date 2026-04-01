import React from 'react';
import './ui.css';

const StarRating = ({ rating = 0, size = 20 }) => {
  const stars = [];
  const rounded = Math.round(rating);

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        className={`ui-star ${i <= rounded ? 'filled' : 'empty'}`}
        style={{ fontSize: size }}
      >
        ★
      </span>
    );
  }

  return <span className="ui-star-rating">{stars}</span>;
};

export default StarRating;
