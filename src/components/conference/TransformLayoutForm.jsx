// components/conference/TransformLayoutForm.jsx

import React, { useState } from "react";

const TransformLayoutForm = ({
  conferenceType,
  availableLayouts = [],
  onTransformLayout,
  onResetLayout,
}) => {
  const [layout, setLayout] = useState("");
  const [hostLayout, setHostLayout] = useState("");
  const [guestLayout, setGuestLayout] = useState("");
  // NEW STATE FOR TEXT OVERLAY
  const [overlayText, setOverlayText] = useState(""); 
  const [isTextEnabled, setIsTextEnabled] = useState(false); // New state to control if the text is sent

  const isLecture = conferenceType === "lecture";

  const handleSubmit = (e) => {
    e.preventDefault();

    let layoutPayload = {};
    let textTransforms = {};

    if (isLecture) {
      if (!hostLayout && !guestLayout && !isTextEnabled) {
        alert("Please select a layout or enter text to enable the overlay.");
        return;
      }
      if (hostLayout) layoutPayload.hostLayout = hostLayout;
      if (guestLayout) layoutPayload.guestLayout = guestLayout;

    } else {
      if (!layout && !isTextEnabled) {
        alert("Please select a layout or enter text to enable the overlay.");
        return;
      }
      if (layout) layoutPayload.layout = layout;
    }
    
    // BUILD TEXT TRANSFORM PAYLOAD
    if (isTextEnabled) {
        textTransforms.text_overlay = {
            // Send the text content. If empty, it will clear any existing overlay.
            text: overlayText, 
            // Position and size can be added here if you want UI controls for them
            // position: 'top', 
            // size: 'medium'
        };
    } else {
        // If disabled, explicitly send an empty text to ensure it's cleared on the server.
        textTransforms.text_overlay = { text: "" };
    }
    
    // SEND THE COMBINED PAYLOAD
    onTransformLayout({
        ...layoutPayload,
        transforms: textTransforms,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ... (Existing Layout Selects - Host, Guest, or Single) ... */}

      {isLecture ? (
        // ... Host/Guest Layout Selects ...
        <>
          <div>
            <label className="block mb-2 font-medium">Host Layout</label>
            <select
              value={hostLayout}
              onChange={(e) => setHostLayout(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Select host layout</option>
              {availableLayouts.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Guest Layout</label>
            <select
              value={guestLayout}
              onChange={(e) => setGuestLayout(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Select guest layout</option>
              {availableLayouts.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        // ... Single Layout Select ...
        <div>
          <label className="block mb-2 font-medium">Layout</label>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select layout</option>
            {availableLayouts.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* NEW TEXT OVERLAY CONTROLS */}
      <div className="border-t pt-4 space-y-3">
        <h4 className="font-semibold">Text Overlay</h4>
        <div className="flex items-center">
            <input
                type="checkbox"
                id="enableText"
                checked={isTextEnabled}
                onChange={(e) => setIsTextEnabled(e.target.checked)}
                className="mr-2"
            />
            <label htmlFor="enableText" className="font-medium text-sm">Enable Overlay Text</label>
        </div>
        <input
          type="text"
          value={overlayText}
          onChange={(e) => setOverlayText(e.target.value)}
          placeholder="Enter message (e.g., Q&A is now open)"
          className="w-full border rounded p-2 text-black"
          disabled={!isTextEnabled}
        />
      </div>


      {/* ... (Buttons) ... */}
      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex-1 rounded bg-primary p-2 text-white hover:bg-opacity-90"
        >
          Apply Layout & Text
        </button>
        <button
          type="button"
          onClick={onResetLayout}
          className="flex-1 rounded bg-graydark p-2 text-white hover:bg-opacity-90"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default TransformLayoutForm;