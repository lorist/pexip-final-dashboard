// src/components/conference/Presentation.jsx (Reverted to original image tag method)

import React from 'react';

/**
 * Displays the active presentation stream using an img tag.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isReceivingPresentation - True if a presentation is active.
 * @param {string} [props.imageUrl] - The URL of the current presentation frame.
 */
const Presentation = ({ isReceivingPresentation, imageUrl }) => {
  if (!isReceivingPresentation) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 rounded-md">
        No presentation active.
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-full max-h-96 w-full"> {/* Container for responsive sizing */}
      {/* Original img tag approach */}
      <img
        src={imageUrl}
        alt="Pexip Presentation"
        className="max-w-full max-h-full object-contain"
        // Add onerror to handle broken image links gracefully
        onError={(e) => {
          e.target.onerror = null; // Prevent infinite loop
          e.target.src = "https://placehold.co/600x400/cccccc/333333?text=Presentation+Error"; // Placeholder image
          console.error("Failed to load presentation image:", imageUrl);
        }}
      />
    </div>
  );
};

export default Presentation;
