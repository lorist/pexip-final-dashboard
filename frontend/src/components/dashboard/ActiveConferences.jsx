// src/components/dashboard/ActiveConferences.jsx (Updated)

import React, { useState, useEffect } from 'react';

const ActiveConferences = ({ conferences }) => {
  const [expandedConferences, setExpandedConferences] = useState(new Set());

  useEffect(() => {
    console.log('ActiveConferences component received conferences:', conferences);
  }, [conferences]);

  const toggleExpand = (conferenceAlias) => {
    setExpandedConferences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conferenceAlias)) {
        newSet.delete(conferenceAlias);
      } else {
        newSet.add(conferenceAlias);
      }
      return newSet;
    });
  };

  return (
    <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h2 className="text-2xl font-semibold text-black dark:text-white mb-6">Active Conferences</h2>

      {conferences.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No active conferences currently.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200 dark:bg-meta-4 text-left text-black dark:text-white">
                <th className="py-4 px-4 font-medium">Conference Name</th>
                <th className="py-4 px-4 font-medium">Destination Alias</th>
                <th className="py-4 px-4 font-medium">Started At</th>
                <th className="py-4 px-4 font-medium">Status</th>
                <th className="py-4 px-4 font-medium">Participants Count</th>
                <th className="py-4 px-4 font-medium">Details</th>
                <th className="py-4 px-4 font-medium">Actions</th> {/* NEW: Actions column header */}
              </tr>
            </thead>
            <tbody>
              {conferences.map((conf) => {
                const isExpanded = expandedConferences.has(conf.conferenceAlias);
                console.log('ActiveConferences: Rendering conference row with data:', conf);
                return (
                  <React.Fragment key={conf.conferenceAlias || conf.timestamp}>
                    <tr className="border-b border-stroke dark:border-strokedark">
                      <td className="py-4 px-4 text-black dark:text-white">{conf.conferenceName || 'N/A'}</td>
                      <td className="py-4 px-4 text-black dark:text-white">{conf.destinationAlias || 'N/A'}</td>
                      <td className="py-4 px-4 text-black dark:text-white">
                        {conf.start_time ? new Date(conf.start_time).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                          conf.is_started ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>
                          {conf.is_started ? 'Started' : 'Ended'}
                        </span>
                        {conf.is_locked && (
                          <span className="inline-flex rounded-full bg-info/10 text-info px-3 py-1 text-sm font-medium ml-2">
                            Locked
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-black dark:text-white">{conf.participants ? conf.participants.length : 0}</td>
                      <td className="py-4 px-4">
                        {conf.participants && conf.participants.length > 0 && (
                          <button
                            onClick={() => toggleExpand(conf.conferenceAlias)}
                            className="text-primary hover:text-primary-dark focus:outline-none"
                            aria-expanded={isExpanded}
                            aria-controls={`participants-details-${conf.conferenceAlias}`}
                          >
                            {isExpanded ? (
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            )}
                          </button>
                        )}
                      </td>
                      {/* NEW: Manage Conference Link */}
                      <td className="py-4 px-4">
                        {conf.is_started && conf.destinationAlias && (
                          <a
                            href={`/login?conferenceAlias=${encodeURIComponent(conf.destinationAlias)}`}
                            target="_blank" // Opens in a new window/tab
                            rel="noopener noreferrer" // Security best practice for target="_blank"
                            className="text-primary hover:underline font-medium"
                          >
                            Manage
                          </a>
                        )}
                      </td>
                    </tr>
                    {isExpanded && conf.participants && conf.participants.length > 0 && (
                      <tr id={`participants-details-${conf.conferenceAlias}`} className="bg-gray-50 dark:bg-boxdark-2">
                        <td colSpan="7" className="py-2 px-4"> {/* UPDATE COLSPAN TO 7 */}
                          <div className="p-2 border border-stroke dark:border-strokedark rounded-md">
                            <h4 className="font-semibold text-black dark:text-white mb-2">Participants:</h4>
                            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                              {conf.participants.map(p => (
                                <li key={p.uuid} className="mb-1">
                                  <strong className="text-black dark:text-white">{p.display_name}</strong> ({p.role})
                                  {p.is_muted === true && <span className="ml-2 text-danger"> (Muted)</span>}
                                  {p.is_video_muted === true && <span className="ml-2 text-danger"> (Video Muted)</span>}
                                  {p.is_presenting === true && <span className="ml-2 text-primary"> (Presenting)</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActiveConferences;