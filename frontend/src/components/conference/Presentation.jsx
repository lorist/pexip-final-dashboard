// src/components/conference/Presentation.jsx

import React from 'react';

const Presentation = ({ isReceivingPresentation, imageUrl }) => {
  // If a presentation is active and we have an image URL, show the image
  if (isReceivingPresentation && imageUrl) {
    return (
      <div>
        <h3 className="font-semibold text-black dark:text-white mb-4">Presentation</h3>
        <div className="rounded-sm border border-stroke bg-black p-1 shadow-default dark:border-strokedark">
          <img src={imageUrl} alt="Live presentation stream" className="w-full" />
        </div>
      </div>
    );
  }

  // Otherwise, show the placeholder message
  return (
    <div className="flex h-full min-h-48 items-center justify-center text-center">
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white">
          Presentation Preview
        </h3>
        <p className="mt-2 text-sm text-bodydark2">
          When a participant starts sharing content, it will be displayed here.
        </p>
      </div>
    </div>
  );
};

export default Presentation;