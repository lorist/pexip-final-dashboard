// components/conference/TextOverlayControls.jsx

import React, { useState } from 'react';

const TextOverlayControls = ({ onSetOverlay, onClearOverlay }) => {
  const [text, setText] = useState('');

  const handleSet = (e) => {
    e.preventDefault();
    if (text.trim()) {
      // Call the hook function with the entered text (using default position/size)
      onSetOverlay({ text });
      // Optionally clear the input after sending:
      // setText(''); 
    } else {
      alert("Please enter text for the overlay.");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-black dark:text-white">Text Overlay</h3>
      <form onSubmit={handleSet} className="space-y-3">
        {/* Text Input */}
        <div>
          <label htmlFor="overlayText" className="block mb-1 text-sm font-medium">Message:</label>
          <input
            id="overlayText"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter overlay message"
            className="w-full border rounded p-2 text-black"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            type="submit"
            className="flex-1 rounded bg-success p-2 text-white hover:bg-opacity-90"
          >
            Set/Update
          </button>
          <button
            type="button"
            onClick={onClearOverlay}
            className="flex-1 rounded bg-danger p-2 text-white hover:bg-opacity-90"
          >
            Clear Overlay
          </button>
        </div>
      </form>
    </div>
  );
};

export default TextOverlayControls;