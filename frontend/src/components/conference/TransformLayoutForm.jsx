// src/components/conference/TransformLayoutForm.jsx

import React, { useState } from 'react';

const TransformLayoutForm = ({ availableLayouts, onTransformLayout, onResetLayout }) => {
  // State for each dropdown
  const [layout, setLayout] = useState('');
  const [guestLayout, setGuestLayout] = useState(''); // NEW: State for the guest layout
  const [enableOverlayText, setEnableOverlayText] = useState('');
  const [activeSpeaker, setActiveSpeaker] = useState('');
  const [streamingIndicator, setStreamingIndicator] = useState('');
  const [recordingIndicator, setRecordingIndicator] = useState('');
  
  const handleSubmit = () => {
    const transforms = {};

    // Only add properties to the transforms object if they have a value
    if (layout) transforms.layout = layout;
    if (guestLayout) transforms.guest_layout = guestLayout; // NEW: Add guest_layout to the transforms
    if (activeSpeaker) transforms.enable_active_speaker_indication = activeSpeaker === 'on';
    if (enableOverlayText) transforms.enable_overlay_text = enableOverlayText === 'on';
    if (streamingIndicator) transforms.streaming_indicator = streamingIndicator === 'on';
    if (recordingIndicator) transforms.recording_indicator = recordingIndicator === 'on';
    
    onTransformLayout(transforms);
  };

  const labelClass = "mb-2 block text-sm text-black dark:text-white";
  const selectClass = "relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-2 px-4 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input";
  const buttonClass = "flex justify-center rounded bg-primary py-2 px-4 font-medium text-white hover:bg-opacity-90";
  const secondaryButtonClass = `${buttonClass} bg-graydark`;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Layout Dropdown */}
        <div>
          <label className={labelClass}>Host Layout</label>
          <div className="relative z-20 bg-transparent dark:bg-form-input">
            <select value={layout} onChange={(e) => setLayout(e.target.value)} className={selectClass}>
              <option value="">Unset</option>
              {Object.keys(availableLayouts).map(layoutKey => (
                <option key={layoutKey} value={layoutKey}>{layoutKey}</option>
              ))}
            </select>
          </div>
        </div>

        {/* NEW: Guest Layout Dropdown */}
        <div>
          <label className={labelClass}>Guest Layout (Virtual Auditorium Only)</label>
          <div className="relative z-20 bg-transparent dark:bg-form-input">
            <select value={guestLayout} onChange={(e) => setGuestLayout(e.target.value)} className={selectClass}>
              <option value="">Unset</option>
              {Object.keys(availableLayouts).map(layoutKey => (
                <option key={layoutKey} value={layoutKey}>{layoutKey}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Text Overlay Dropdown */}
        <div>
          <label className={labelClass}>Text Overlay</label>
          <div className="relative z-20 bg-transparent dark:bg-form-input">
            <select value={enableOverlayText} onChange={(e) => setEnableOverlayText(e.target.value)} className={selectClass}>
              <option value="">Unset</option>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>
        </div>

        {/* Active Speaker Dropdown */}
        <div>
          <label className={labelClass}>Active Speaker</label>
          <div className="relative z-20 bg-transparent dark:bg-form-input">
            <select value={activeSpeaker} onChange={(e) => setActiveSpeaker(e.target.value)} className={selectClass}>
              <option value="">Unset</option>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>
        </div>

        {/* Streaming Indicator Dropdown */}
        <div>
          <label className={labelClass}>Streaming Indicator</label>
          <div className="relative z-20 bg-transparent dark:bg-form-input">
            <select value={streamingIndicator} onChange={(e) => setStreamingIndicator(e.target.value)} className={selectClass}>
              <option value="">Unset</option>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>
        </div>

        {/* Recording Indicator Dropdown */}
        <div>
          <label className={labelClass}>Recording Indicator</label>
          <div className="relative z-20 bg-transparent dark:bg-form-input">
            <select value={recordingIndicator} onChange={(e) => setRecordingIndicator(e.target.value)} className={selectClass}>
              <option value="">Unset</option>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 mt-4">
        <button type="button" onClick={handleSubmit} className={buttonClass}>Transform Layout</button>
        <button type="button" onClick={onResetLayout} className={secondaryButtonClass}>Reset Transformation</button>
      </div>
    </div>
  );
};

export default TransformLayoutForm;