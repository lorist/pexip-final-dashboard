// src/components/conference/PinningConfigForm.jsx

import React, { useState, useEffect } from 'react';

const PinningConfigForm = ({ availableConfigs, activeConfig, onSetPinningConfig, onClearPinningConfig }) => {
  const [selectedConfig, setSelectedConfig] = useState('');

  useEffect(() => {
    if (Array.isArray(availableConfigs) && availableConfigs.length > 0) {
      setSelectedConfig(availableConfigs[0]);
    }
  }, [availableConfigs]);

  const handleSet = () => {
    if (!selectedConfig) {
      alert('Please select a configuration.');
      return;
    }
    onSetPinningConfig(selectedConfig);
  };

  const hasConfigs = Array.isArray(availableConfigs) && availableConfigs.length > 0;

  // Tailwind classes for consistent styling
  const labelClass = "mb-2 block text-black dark:text-white";
  const selectClass = "relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input";
  const buttonClass = "flex justify-center rounded bg-primary py-2 px-4 font-medium text-gray hover:bg-opacity-90";

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="pinning_config" className={labelClass}>
          Available Configurations
        </label>
        <div className="relative z-20 bg-transparent dark:bg-form-input">
          <select
            id="pinning_config"
            value={selectedConfig}
            onChange={(e) => setSelectedConfig(e.target.value)}
            disabled={!hasConfigs}
            className={selectClass}
          >
            {hasConfigs ? (
              availableConfigs.map(config => (
                <option key={config} value={config}>{config}</option>
              ))
            ) : (
              <option>No configs available</option>
            )}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={handleSet} disabled={!hasConfigs} className={buttonClass}>
          Set Pinning Config
        </button>
        <button type="button" onClick={onClearPinningConfig} className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}>
          Clear Pinning Config
        </button>
      </div>
      <div className="mt-4 pt-4 border-t border-stroke dark:border-strokedark">
        <h4 className="font-medium text-black dark:text-white">
          Currently Active: <span className="text-primary">{activeConfig || 'None'}</span>
        </h4>
      </div>
    </div>
  );
};

export default PinningConfigForm;