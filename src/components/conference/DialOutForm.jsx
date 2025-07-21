// src/components/conference/DialOutForm.jsx

import React, { useState } from 'react';

const DialOutForm = ({ onDialOut }) => {
  const [protocol, setProtocol] = useState('auto');
  const [remoteAlias, setRemoteAlias] = useState('');
  const [role, setRole] = useState('guest');

  const handleDial = () => {
    if (!remoteAlias) {
      alert('Remote alias is required.');
      return;
    }
    onDialOut({
      protocol,
      destination: remoteAlias,
      role,
    });
    setRemoteAlias('');
  };

  // Tailwind classes for consistent styling
  const labelClass = "mb-2 block text-black dark:text-white";
  const inputClass = "w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary";
  const selectWrapperClass = "relative z-20 bg-transparent dark:bg-form-input";
  const selectClass = "relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input";
  const buttonClass = "flex justify-center rounded bg-primary py-2 px-4 font-medium text-gray hover:bg-opacity-90";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="protocol" className={labelClass}>Protocol</label>
        <div className={selectWrapperClass}>
          <select id="protocol" value={protocol} onChange={(e) => setProtocol(e.target.value)} className={selectClass}>
            <option value="auto">Auto</option>
            <option value="sip">SIP</option>
            <option value="h323">H.323</option>
            <option value="mssip">Lync</option>
            <option value="rtmp">RTMP</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="remotealias" className={labelClass}>Remote Alias</label>
        <input
          id="remotealias"
          type="text"
          value={remoteAlias}
          onChange={(e) => setRemoteAlias(e.target.value)}
          placeholder="e.g., user@example.com"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="role" className={labelClass}>Role</label>
        <div className={selectWrapperClass}>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
            <option value="guest">Guest</option>
            <option value="host">Host</option>
          </select>
        </div>
      </div>
      
      <div className="mt-2">
        <button type="button" onClick={handleDial} className={buttonClass}>
          Dial
        </button>
      </div>
    </div>
  );
};

export default DialOutForm;