// src/App.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout and components
import AppLayout from './layout/AppLayout.tsx';
import ConnectionForm from './components/forms/ConnectionForm';
import Roster from './components/conference/Roster';
import ConferenceActions from './components/conference/ConferenceActions';
import Chat from './components/conference/Chat';
import Presentation from './components/conference/Presentation';
import LayoutControl from './components/conference/LayoutControl';
import DialOutForm from './components/conference/DialOutForm';
import PinningConfigForm from './components/conference/PinningConfigForm';
// Import the new ActiveConferences component
import ActiveConferences from './components/dashboard/ActiveConferences'; 

function App() {
  // --- STATE MANAGEMENT ---
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState(null);
  const [tokenExpires, setTokenExpires] = useState(120);
  const [conferenceAlias, setConferenceAlias] = useState('');
  const [conferenceDisplayName, setConferenceDisplayName] = useState('');
  const [participants, setParticipants] = useState([]); // This is for the *current* conference
  const [conferenceState, setConferenceState] = useState({ isLocked: false, guestsMuted: false, guestsCanUnmute: false });
  const [messages, setMessages] = useState([]);
  const [isReceivingPresentation, setIsReceivingPresentation] = useState(false);
  const [presentationImageUrl, setPresentationImageUrl] = useState('');
  const [availableLayouts, setAvailableLayouts] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [pin, setPin] = useState('');
  const [availablePinningConfigs, setAvailablePinningConfigs] = useState([]);
  const [activePinningConfig, setActivePinningConfig] = useState('');
  const [activeLayout, setActiveLayout] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false); // State for chat visibility

  // New state for active conferences, now including participants array
  const [activeConferences, setActiveConferences] = useState([]);

  // --- REFS ---
  const appStateRef = useRef();
  appStateRef.current = { token, conferenceAlias, pin };
  const eventSourceRef = useRef(null);
  const eventSinkSourceRef = useRef(null); // Ref for event sink EventSource

  // --- HOOKS ---

  // Effect for setting dark mode on body
  // useEffect(() => {
  //   document.body.classList.add('dark');
  // }, []);

  // Effect for handling beforeunload to release token
  useEffect(() => {
    const handleBeforeUnload = () => {
      const { token: currentToken, conferenceAlias: currentConference, pin: currentPin } = appStateRef.current;
      if (!currentToken || !currentConference) return;
      const apiUrl = `/api/client/v2/conferences/${currentConference}/release_token`;
      const headers = { 'Content-Type': 'application/json', token: currentToken, pin: currentPin };
      // Use keepalive to ensure the request goes through during page unload
      fetch(apiUrl, { method: 'POST', headers, keepalive: true });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Effect for main conference EventSource
  useEffect(() => {
    // Only connect if connected, token exists, conference alias exists, and EventSource not already open
    if (!isConnected || !token || !conferenceAlias || eventSourceRef.current) {
      return;
    }

    const eventsUrl = `/api/client/v2/conferences/${conferenceAlias}/events?token=${token}`;
    const eventSource = new EventSource(eventsUrl);
    eventSourceRef.current = eventSource; // Store EventSource instance in ref

    // Event listeners for conference updates
    eventSource.addEventListener('conference_update', (event) => {
      const update = JSON.parse(event.data);
      setConferenceState(prevState => ({
        ...prevState,
        isLocked: update.locked,
        guestsMuted: update.guests_muted,
        guestsCanUnmute: update.guests_can_unmute
      }));
      if (update.pinning_config !== undefined) setActivePinningConfig(update.pinning_config);
      if (update.layout !== undefined) setActiveLayout(update.layout);
    });

    eventSource.addEventListener('layout', (event) => {
      const layoutUpdate = JSON.parse(event.data);
      if (layoutUpdate && layoutUpdate.view) setActiveLayout(layoutUpdate.view);
    });

    eventSource.addEventListener('message_received', (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    });

    eventSource.addEventListener('participant_create', (event) => {
      const newParticipant = JSON.parse(event.data);
      setParticipants(prev => {
        // Prevent duplicate participants if event is received multiple times
        if (prev.some(p => p.uuid === newParticipant.uuid)) return prev;
    // This line needs the nullish coalescing operator
    return [...prev, newParticipant].sort((a, b) => (a.display_name ?? '').localeCompare(b.display_name ?? ''));
      });
    });

    eventSource.addEventListener('participant_update', (event) => {
      const updatedParticipant = JSON.parse(event.data);
      setParticipants(prev => prev.map(p => p.uuid === updatedParticipant.uuid ? updatedParticipant : p));
    });

    eventSource.addEventListener('participant_delete', (event) => {
      const deletedParticipant = JSON.parse(event.data);
      setParticipants(prev => prev.filter(p => p.uuid !== deletedParticipant.uuid));
    });

    eventSource.addEventListener('presentation_start', () => setIsReceivingPresentation(true));

    eventSource.addEventListener('presentation_stop', () => {
      setIsReceivingPresentation(false);
      // Revoke the old URL to prevent memory leaks
      if (presentationImageUrl) URL.revokeObjectURL(presentationImageUrl);
      setPresentationImageUrl('');
    });

    eventSource.addEventListener('presentation_frame', async (event) => {
      const imageUrlPath = `/api/client/v2/conferences/${conferenceAlias}/presentation.jpeg?id=${event.lastEventId}&token=${token}`;
      try {
        const response = await fetch(imageUrlPath, { method: 'GET', headers: { 'token': token } });
        if (response.ok) {
          const imageBlob = await response.blob();
          const newImageUrl = URL.createObjectURL(imageBlob);
          setPresentationImageUrl(oldUrl => {
            // Revoke the previous object URL to avoid memory leaks
            if (oldUrl) URL.revokeObjectURL(oldUrl);
            return newImageUrl;
          });
        }
      } catch (error) {
        console.error("Failed to fetch presentation frame:", error);
      }
    });

    eventSource.addEventListener('disconnect', (event) => {
      // Using a custom message box instead of alert()
      // You would replace this with your actual modal/message box component
      console.log(`Disconnected: ${JSON.parse(event.data).reason}`);
      handleLeave(); // Clean up state on disconnect
    });

    eventSource.onerror = () => {
      console.error("Main EventSource encountered an error.");
      handleLeave(); // Clean up state on error
    };

    // Cleanup function for main EventSource
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isConnected, token, conferenceAlias, presentationImageUrl]); // Added presentationImageUrl to dependencies for revokeObjectURL

  // Effect to fetch initial active conferences data from backend (for overview page)
  useEffect(() => {
    const fetchInitialConferences = async () => {
      try {
        const response = await fetch('/active-conferences-data'); // New endpoint
        if (response.ok) {
          const data = await response.json();
          // Ensure booleans are correctly parsed if coming from SQLite (INTEGER 0/1)
          const parsedData = data.map(conf => ({
            ...conf,
            is_started: Boolean(conf.is_started),
            is_locked: Boolean(conf.is_locked),
            // Ensure destinationAlias is included
            destinationAlias: conf.destinationAlias,
            participants: conf.participants.map(p => ({
              ...p,
              is_muted: Boolean(p.is_muted),
              is_video_muted: Boolean(p.is_video_muted),
              is_presenting: Boolean(p.is_presenting)
            }))
          }));
          setActiveConferences(parsedData);
          console.log('App.jsx: Initial conferences fetched (overview):', parsedData);
        } else {
          console.error('Failed to fetch initial active conferences (overview):', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching initial active conferences (overview):', error);
      }
    };

    fetchInitialConferences();
  }, []); // Run once on component mount

  // Effect for Pexip Event Sink EventSource (for real-time updates)
  useEffect(() => {
    // Only connect if EventSource not already open
    if (eventSinkSourceRef.current) {
      return;
    }

    const eventSinkUrl = `/sse-events`;
    const eventSinkSource = new EventSource(eventSinkUrl);
    eventSinkSourceRef.current = eventSinkSource; // Store EventSource instance in ref

    eventSinkSource.addEventListener('conference_started', (event) => {
      const conferenceData = JSON.parse(event.data);
      console.log('Conference Started (from EventSource):', conferenceData);
      setActiveConferences(prevConferences => {
        // Add new conference if not already present, initialize with empty participants array
        if (!prevConferences.some(conf => conf.conferenceAlias === conferenceData.conferenceAlias)) {
          const newConferences = [...prevConferences, { ...conferenceData, start_time: new Date().toISOString(), participants: [] }];
          console.log('App.jsx: activeConferences after add:', newConferences); // Log after state update
          return newConferences;
        }
        console.log('App.jsx: activeConferences (no change on add):', prevConferences); // Log if no change
        return prevConferences;
      });
    });

    eventSinkSource.addEventListener('conference_ended', (event) => {
      const conferenceData = JSON.parse(event.data);
      console.log('Conference Ended (from EventSource):', conferenceData);
      setActiveConferences(prevConferences => {
        const newConferences = prevConferences.filter(conf => conf.conferenceAlias !== conferenceData.conferenceAlias);
        console.log('App.jsx: activeConferences after remove:', newConferences); // Log after state update
        return newConferences;
      });
    });

    eventSinkSource.addEventListener('conference_updated', (event) => {
      const conferenceData = JSON.parse(event.data);
      console.log('Conference Updated (from EventSource):', conferenceData);
      setActiveConferences(prevConferences => {
        return prevConferences.map(conf => {
          if (conf.conferenceAlias === conferenceData.conferenceAlias) {
            return {
              ...conf,
              is_started: conferenceData.is_started,
              is_locked: conferenceData.is_locked,
              // Ensure destinationAlias is updated if available (from participant_connected events)
              destinationAlias: conferenceData.destinationAlias !== undefined ? conferenceData.destinationAlias : conf.destinationAlias,
            };
          }
          return conf;
        });
      });
    });

    eventSinkSource.addEventListener('participant_connected', (event) => {
      const eventData = JSON.parse(event.data);
      console.log('Participant Connected (from EventSource):', eventData);
      setActiveConferences(prevConferences => {
        return prevConferences.map(conf => {
          if (conf.conferenceAlias === eventData.conferenceAlias) {
            // Update conference with destinationAlias if it's new
            const updatedConf = { ...conf };
            if (eventData.destinationAlias && !updatedConf.destinationAlias) {
              updatedConf.destinationAlias = eventData.destinationAlias;
            }

            // Add participant if not already present
            if (!updatedConf.participants.some(p => p.uuid === eventData.participant.uuid)) {
              return {
                ...updatedConf,
                participants: [...updatedConf.participants, eventData.participant].sort((a, b) => (a.display_name ?? '').localeCompare(b.display_name ?? ''))
              };
            }
            return updatedConf; // Return updatedConf even if no participant added
          }
          return conf;
        });
      });
      // Also update the 'participants' state for the *currently joined* conference if it matches
      if (conferenceAlias === eventData.conferenceAlias) {
        setParticipants(prev => {
          if (!prev.some(p => p.uuid === eventData.participant.uuid)) {
            return [...prev, eventData.participant].sort((a, b) => (a.display_name ?? '').localeCompare(b.display_name ?? ''));
          }
          return prev;
        });
      }
    });

    eventSinkSource.addEventListener('participant_updated', (event) => {
      const eventData = JSON.parse(event.data);
      console.log('Participant Updated (from EventSource):', eventData);
      setActiveConferences(prevConferences => {
        return prevConferences.map(conf => {
          if (conf.conferenceAlias === eventData.conferenceAlias) {
            return {
              ...conf,
              participants: conf.participants.map(p =>
                p.uuid === eventData.participant.uuid ? eventData.participant : p
              )
            };
          }
          return conf;
        });
      });
      // Also update the 'participants' state for the *currently joined* conference if it matches
      if (conferenceAlias === eventData.conferenceAlias) {
        setParticipants(prev => prev.map(p => p.uuid === eventData.participant.uuid ? eventData.participant : p));
      }
    });

    eventSinkSource.addEventListener('participant_disconnected', (event) => {
      const eventData = JSON.parse(event.data);
      console.log('Participant Disconnected (from EventSource):', eventData);
      setActiveConferences(prevConferences => {
        return prevConferences.map(conf => {
          if (conf.conferenceAlias === eventData.conferenceAlias) {
            return {
              ...conf,
              participants: conf.participants.filter(p => p.uuid !== eventData.participant.uuid)
            };
          }
          return conf;
        });
      });
      // Also update the 'participants' state for the *currently joined* conference if it matches
      if (conferenceAlias === eventData.conferenceAlias) {
        setParticipants(prev => prev.filter(p => p.uuid !== eventData.participant.uuid));
      }
    });


    eventSinkSource.onerror = (error) => {
      console.error("Event Sink EventSource encountered an error:", error);
      // Attempt to reconnect after a delay, or handle more robustly
      if (eventSinkSourceRef.current) {
        eventSinkSourceRef.current.close();
        eventSinkSourceRef.current = null;
      }
      // Optional: Implement a retry mechanism here
    };

    // Cleanup function for event sink EventSource
    return () => {
      if (eventSinkSourceRef.current) {
        eventSinkSourceRef.current.close();
        eventSinkSourceRef.current = null;
      }
    };
  }, [conferenceAlias]); // Added conferenceAlias to dependencies to ensure participant events update current conference's participants state

  // Effect for token refresh
  useEffect(() => {
    if (!isConnected || !token) return;
    const refreshInterval = (tokenExpires * 1000) * 0.8; // Refresh 80% of the way through token expiry
    const timerId = setTimeout(() => refreshToken(), refreshInterval);
    return () => clearTimeout(timerId);
  }, [isConnected, token, tokenExpires]);

  // Effect to open chat on first message
  useEffect(() => {
    if (messages.length === 1 && !isChatOpen) {
      setIsChatOpen(true);
    }
  }, [messages, isChatOpen]);

  // --- API HELPERS ---
  const pexipApiGet = async (path, currentToken) => {
    try {
      const response = await fetch(path, { method: 'GET', headers: { 'token': currentToken } });
      if (response.status === 404) return { notFound: true };
      if (response.ok) return await response.json();
    } catch (error) { console.error(`API GET call to ${path} failed:`, error); }
    return null;
  };
  const pexipApiPost = async (path) => {
    try {
      await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'token': token } });
    } catch (error) { console.error(`API call to ${path} failed:`, error); }
  };
  const pexipApiPostWithBody = async (path, body) => {
    try {
      await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'token': token }, body: JSON.stringify(body) });
    } catch (error) { console.error(`API call to ${path} failed:`, error); }
  };

  // --- HANDLER FUNCTIONS ---
  const refreshToken = async () => {
    const apiPath = `/api/client/v2/conferences/${conferenceAlias}/refresh_token`;
    try {
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token }
      });
      if (response.ok) {
        const result = await response.json();
        setToken(result.result.token);
        setTokenExpires(result.result.expires);
      } else {
        // If token refresh fails, assume disconnection
        handleLeave();
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      handleLeave(); // Disconnect on network error during refresh
    }
  };

  const handleLogin = async (formData) => {
    const { conference, pin, displayName } = formData;
    const apiUrl = `/api/client/v2/conferences/${conference}/request_token`;
    const requestBody = { display_name: displayName, start_conference_if_host: true, direct_media: true, supports_direct_chat: true };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'pin': pin || "" },
        body: JSON.stringify(requestBody)
      });
      const result = await response.json();
      if (response.ok) {
        const newToken = result.result.token;
        // Fetch available layouts
        const layouts = await pexipApiGet(`/api/client/v2/conferences/${conference}/layout_svgs`, newToken);
        if (layouts) setAvailableLayouts(layouts.result);
        // Fetch available pinning configurations
        const pinningConfigs = await pexipApiGet(`/api/client/v2/conferences/${conference}/available_pinning_configs`, newToken);
        if (pinningConfigs && pinningConfigs.result) setAvailablePinningConfigs(pinningConfigs.result);

        setToken(newToken);
        setPin(pin);
        setUserRole(result.result.role);
        setConferenceAlias(conference);
        setConferenceDisplayName(result.result.conference_name);
        setTokenExpires(result.result.expires || 120);
        setIsConnected(true);

        // NEW: Fetch initial participants for the *joined* conference from the backend
        try {
          const participantsResponse = await fetch(`/active-conferences-data/${conference}/participants`);
          if (participantsResponse.ok) {
            const initialParticipants = await participantsResponse.json();
            // Ensure booleans are correctly parsed from SQLite (INTEGER 0/1) for current participants
            const parsedParticipants = initialParticipants.map(p => ({
              ...p,
              is_muted: Boolean(p.is_muted),
              is_video_muted: Boolean(p.is_video_muted),
              is_presenting: Boolean(p.is_presenting)
            }));
            setParticipants(parsedParticipants);
            console.log(`App.jsx: Initial participants fetched for joined conference '${conference}':`, parsedParticipants);
          } else {
            console.error(`Failed to fetch initial participants for joined conference '${conference}':`, participantsResponse.statusText);
            setParticipants([]); // Ensure it's an empty array on failure
          }
        } catch (error) {
          console.error(`Error fetching initial participants for joined conference '${conference}':`, error);
          setParticipants([]); // Ensure it's an empty array on error
        }

      } else {
        // Using a custom message box instead of alert()
        console.error(`Failed to join: ${result.result || JSON.stringify(result)}`);
      }
    } catch (error) {
      // Using a custom message box instead of alert()
      console.error('A network error occurred. Please check your Nginx proxy configuration.', error);
    }
  };

  const handleLeave = () => {
    // Close the main EventSource connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    // Release the token if connected to a conference
    if (token && conferenceAlias) {
      const apiPath = `/api/client/v2/conferences/${conferenceAlias}/release_token`;
      pexipApiPost(apiPath);
    }
    // Clean up all conference-related state
    setIsConnected(false);
    setToken(null);
    setConferenceAlias('');
    setConferenceDisplayName('');
    setParticipants([]);
    setConferenceState({ isLocked: false, guestsMuted: false, guestsCanUnmute: false });
    setMessages([]);
    // Revoke presentation image URL to prevent memory leaks
    if (presentationImageUrl) URL.revokeObjectURL(presentationImageUrl);
    setPresentationImageUrl('');
    setAvailableLayouts({});
    setUserRole(null);
    setPin('');
    setAvailablePinningConfigs([]);
    setActivePinningConfig('');
  };

  // Handler for toggling chat visibility
  const handleToggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  const handleDialOut = (dialData) => {
    const apiPath = `/api/client/v2/conferences/${conferenceAlias}/dial`;
    const headers = { 'Content-Type': 'application/json', 'token': token };
    if (pin) headers.pin = pin; // Include PIN if it exists
    try {
      fetch(apiPath, { method: 'POST', headers: headers, body: JSON.stringify(dialData) });
    } catch (error) { console.error(`API call to ${path} failed:`, error); }
  };

  const handleSetPinningConfig = (configName) => {
    const apiPath = `/api/client/v2/conferences/${conferenceAlias}/set_pinning_config`;
    const body = { pinning_config: configName };
    const headers = { 'Content-Type': 'application/json', 'token': token };
    if (pin) headers.pin = pin;
    try {
      fetch(apiPath, { method: 'POST', headers: headers, body: JSON.stringify(body) });
    } catch (error) { console.error(`API call to ${path} failed:`, error); }
  };

  const handleClearPinningConfig = () => {
    const apiPath = `/api/client/v2/conferences/${conferenceAlias}/set_pinning_config`;
    const body = { pinning_config: "" }; // Empty string to clear pinning config
    const headers = { 'Content-Type': 'application/json', 'token': token };
    if (pin) headers.pin = pin;
    try {
      fetch(apiPath, { method: 'POST', headers: headers, body: JSON.stringify(body) });
    } catch (error) { console.error(`API call to ${path} failed:`, error); }
  };

  const handleOverrideLayout = (layoutData) => { pexipApiPostWithBody(`/api/client/v2/conferences/${conferenceAlias}/override_layout`, { layouts: [layoutData] }); };
  const handleResetLayout = () => { pexipApiPostWithBody(`/api/client/v2/conferences/${conferenceAlias}/override_layout`, { layouts: [] }); };
  const handleLockToggle = () => { pexipApiPost(`/api/client/v2/conferences/${conferenceAlias}/${conferenceState.isLocked ? 'unlock' : 'lock'}`); };
  const handleMuteAllToggle = () => { pexipApiPost(`/api/client/v2/conferences/${conferenceAlias}/${conferenceState.guestsMuted ? 'unmuteguests' : 'muteguests'}`); };
  const handleToggleGuestsCanUnmute = () => { pexipApiPostWithBody(`/api/client/v2/conferences/${conferenceAlias}/set_guests_can_unmute`, { setting: !conferenceState.guestsCanUnmute }); };
  const handleSendMessage = (messageText) => {
    const localMessage = { origin: 'Me', payload: messageText };
    setMessages(prev => [...prev, localMessage]); // Add message to local state immediately
    pexipApiPostWithBody(`/api/client/v2/conferences/${conferenceAlias}/message`, { type: 'text/plain', payload: messageText });
  };
  const handleMuteToggle = (participantId) => {
    const p = participants.find(p => p.uuid === participantId);
    if (p) pexipApiPost(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/${p.is_muted === 'YES' ? 'unmute' : 'mute'}`);
  };
  const handleDisconnect = (participantId) => { pexipApiPost(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/disconnect`); };
  const handleCreatePersonalMix = (participantId) => { pexipApiPostWithBody(`/api/client/v2/conferences/${conferenceAlias}/video_mixes/create`, { mix_name: `main.!${participantId}` }); };
  const handleConfigurePersonalMix = (participantId, layout) => { pexipApiPostWithBody(`/api/client/v2/conferences/${conferenceAlias}/video_mixes/main.!${participantId}/configure`, { transform_layout: { layout: layout } }); };
  const handleDeletePersonalMix = (participantId) => { pexipApiPost(`/api/client/v2/conferences/${conferenceAlias}/video_mixes/main.!${participantId}/delete`); };
  const handleSpotlightToggle = (participantId) => {
    const p = participants.find(p => p.uuid === participantId);
    if (p) pexipApiPost(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/${p.spotlight !== 0 ? 'spotlightoff' : 'spotlighton'}`);
  };
  const handleToggleVideoMute = (participantId) => {
    const p = participants.find(p => p.uuid === participantId);
    if (p) pexipApiPost(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/${p.is_video_muted ? 'video_unmuted' : 'video_muted'}`);
  };
  const handleToggleSeePresentation = (participantId) => {
    const p = participants.find(p => p.uuid === participantId);
    if (p) pexipApiPost(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/${p.rx_presentation_policy === 'ALLOW' ? 'denyrxpresentation' : 'allowrxpresentation'}`);
  };
  const handleSetRole = (participantId, role) => { pexipApiPostWithBody(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/role`, { role: role }); };

  // This is the content that will be displayed inside the dashboard layout when connected
  const DashboardContent = () => {
    // Log the participants prop being passed to Roster
    console.log('DashboardContent rendering. Participants for Roster:', participants);
    return (
      <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
        <main className={`col-span-12 ${isChatOpen ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col gap-4`}>
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <Roster
              participants={participants}
              availableLayouts={availableLayouts}
              userRole={userRole}
              onMuteToggle={handleMuteToggle}
              onDisconnect={handleDisconnect}
              onCreatePersonalMix={handleCreatePersonalMix}
              onConfigurePersonalMix={handleConfigurePersonalMix}
              onDeletePersonalMix={handleDeletePersonalMix}
              onSpotlightToggle={handleSpotlightToggle}
              onToggleVideoMute={handleToggleVideoMute}
              onToggleSeePresentation={handleToggleSeePresentation}
              onSetRole={handleSetRole}
            />
          </div>
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <Presentation isReceivingPresentation={isReceivingPresentation} imageUrl={presentationImageUrl} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <ConferenceActions
                isLocked={conferenceState.isLocked}
                onLockToggle={handleLockToggle}
                guestsMuted={conferenceState.guestsMuted}
                onMuteAllToggle={handleMuteAllToggle}
                guestsCanUnmute={conferenceState.guestsCanUnmute}
                onToggleGuestsCanUnmute={handleToggleGuestsCanUnmute}
              />
            </div>
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <LayoutControl availableLayouts={availableLayouts} activeLayout={activeLayout} onOverrideLayout={handleOverrideLayout} onResetLayout={handleResetLayout} />
            </div>
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <PinningConfigForm availableConfigs={availablePinningConfigs} activeConfig={activePinningConfig} onSetPinningConfig={handleSetPinningConfig} onClearPinningConfig={handleClearPinningConfig} />
            </div>
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <DialOutForm onDialOut={handleDialOut} />
            </div>
          </div>
          
        </main>
        {isChatOpen && (
          <aside className="col-span-12 lg:col-span-4 h-full">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark h-full flex flex-col">\
              <Chat messages={messages} onSendMessage={handleSendMessage} />
            </div>
          </aside>
        )}
      </div>
    );
  };

  return (
    <Routes>
      {/* Route for the Active Conferences page - accessible without login */}
      {/* This route now renders AppLayout directly with ActiveConferences as its child */}
      <Route path="/active-conferences" element={<AppLayout onLeave={handleLeave} onToggleChat={handleToggleChat} conferenceDisplayName={conferenceDisplayName}><ActiveConferences conferences={activeConferences} /></AppLayout>} />

      {/* Conditional route for the main dashboard when connected */}
      {isConnected ? (
        <Route path="/" element={
          <AppLayout onLeave={handleLeave} onToggleChat={handleToggleChat} conferenceDisplayName={conferenceDisplayName}>
            <DashboardContent />
          </AppLayout>
        } />
      ) : (
        // If not connected, show the login form
        <Route path="/login" element={<ConnectionForm onLogin={handleLogin} />} />
      )}
      {/* Redirect any other path to login if not connected and not on active-conferences */}
      {!isConnected && <Route path="*" element={<Navigate to="/login" replace />} />}
      {isConnected && <Route path="*" element={<Navigate to="/" replace />} />}
    </Routes>
  );
}

export default App;
