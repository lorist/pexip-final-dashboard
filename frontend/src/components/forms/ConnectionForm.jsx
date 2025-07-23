// src/components/forms/ConnectionForm.jsx (Updated)

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // Import useSearchParams

const ConnectionForm = ({ onLogin }) => {
  const [searchParams] = useSearchParams(); // Hook to access URL query parameters
  
  // Initialize conference state with value from URL param or empty string
  const [conference, setConference] = useState(searchParams.get('conferenceAlias') || '');
  const [pin, setPin] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Optional: If you want to log the pre-populated value
  useEffect(() => {
    if (searchParams.get('conferenceAlias')) {
      console.log('ConnectionForm: Pre-populating conference alias from URL:', searchParams.get('conferenceAlias'));
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ conference, pin, displayName });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-boxdark shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-center text-black dark:text-white mb-6">Join Pexip Conference</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="conference" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Conference Alias
            </label>
            <input
              type="text"
              id="conference"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-meta-4 text-black dark:text-white"
              value={conference}
              onChange={(e) => setConference(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              PIN (Optional)
            </label>
            <input
              type="password"
              id="pin"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-meta-4 text-black dark:text-white"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-meta-4 text-black dark:text-white"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConnectionForm;