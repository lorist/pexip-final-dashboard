// src/components/forms/ConnectionForm.jsx

import React, { useState } from 'react';

const ConnectionForm = ({ onLogin }) => {
  const [conference, setConference] = useState('pinning');
  const [pin, setPin] = useState('1111');
  const [displayName, setDisplayName] = useState('Concierge');

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin({ conference, pin, displayName });
  };

  return (
    // This outer container handles the full-page background and centering
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-boxdark-2">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-boxdark">
        <h2 className="text-2xl font-bold text-center text-black dark:text-white">Connect to Conference</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Conference Alias</label>
            <input
              type="text"
              value={conference}
              onChange={(e) => setConference(e.target.value)}
              className="w-full p-3 mt-1 text-black bg-gray-50 rounded-md border border-gray-300 focus:ring-primary focus:border-primary dark:bg-form-input dark:border-strokedark dark:placeholder-gray-400 dark:text-white"
              required
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 mt-1 text-black bg-gray-50 rounded-md border border-gray-300 focus:ring-primary focus:border-primary dark:bg-form-input dark:border-strokedark dark:placeholder-gray-400 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN (optional)</label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-3 mt-1 text-black bg-gray-50 rounded-md border border-gray-300 focus:ring-primary focus:border-primary dark:bg-form-input dark:border-strokedark dark:placeholder-gray-400 dark:text-white"
            />
          </div>
          <div>
            <button type="submit" className="w-full py-3 px-4 text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Join Conference
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectionForm;