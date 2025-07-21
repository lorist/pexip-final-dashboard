// src/components/conference/LayoutControl.jsx

import React, { useState } from 'react';

const LayoutControl = ({ availableLayouts, activeLayout, onOverrideLayout, onResetLayout }) => {
  const [layout, setLayout] = useState('1:7');

  const handleOverride = () => {
    onOverrideLayout({ layout });
  };
  
  const labelClass = "mb-2 block text-black dark:text-white";
  const selectClass = "relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input";
  const buttonClass = "flex justify-center rounded bg-primary py-2 px-4 font-medium text-white hover:bg-opacity-90";

  return (
    <div>
      <div className="mb-4">
        <label className={labelClass}>Layout</label>
        <div className="relative z-20 bg-transparent dark:bg-form-input">
          <select value={layout} onChange={(e) => setLayout(e.target.value)} className={selectClass}>
            {Object.keys(availableLayouts).map(layoutKey => (
              <option key={layoutKey} value={layoutKey}>{layoutKey}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-4">
        <button type="button" onClick={handleOverride} className={buttonClass}>Override Layout</button>
        <button type="button" onClick={onResetLayout} className={`${buttonClass} bg-graydark hover:bg-opacity-90`}>Reset Layout</button>
      </div>
      {/* NEW: Display the active layout */}
      <div className="mt-4 pt-4 border-t border-stroke dark:border-strokedark">
        <h4 className="font-medium text-black dark:text-white">
          Currently Active: <span className="text-primary">{activeLayout || 'Default'}</span>
        </h4>
      </div>
    </div>
  );
};

export default LayoutControl;