// src/components/conference/Presentation.jsx

import React from 'react';

const Presentation = ({ isReceivingPresentation, imageUrl }) => {
  // Only render the component if a presentation is active
  if (!isReceivingPresentation) {
    return null;
  }

  return (
    <div className="presentation-container">
      <h3>Presentation</h3>
      <img src={imageUrl} alt="Live presentation stream" />
    </div>
  );
};

export default Presentation;