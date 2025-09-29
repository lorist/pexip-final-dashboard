import { useEffect, useRef, useState } from 'react';
import { apiGet, apiPost, apiPostJSON } from '../api/pexipClient';
import toast from "react-hot-toast";

// 🔄 Shared helper: fetch and normalize layouts into a dictionary
async function loadAvailableLayouts(conference, token) {
  const layouts = await apiGet(
    `/api/client/v2/conferences/${conference}/available_layouts`,
    token
  ).catch(() => null);

  console.log("Available layouts response:", layouts);

  if (!layouts || !layouts.result) return {};

  if (Array.isArray(layouts.result)) {
    const dict = {};
    layouts.result.forEach((key) => { dict[key] = key; });
    return dict;
  }

  return {};
}

export default function useConference() {
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState(null);
  const [tokenExpires, setTokenExpires] = useState(120);
  const [conferenceAlias, setConferenceAlias] = useState('');
  const [conferenceType, setConferenceType] = useState('');
  const [conferenceDisplayName, setConferenceDisplayName] = useState('');

  const [participants, setParticipants] = useState([]);
  const [guests, setGuests] = useState([]);

  const [conferenceState, setConferenceState] = useState({
    isLocked: false,
    guestsMuted: false,
    guestsCanUnmute: false,
  });

  const [messages, setMessages] = useState([]);
  const [isReceivingPresentation, setIsReceivingPresentation] = useState(false);
  const [presentationImageUrl, setPresentationImageUrl] = useState('');

  // ✅ just one source of truth
  const [availableLayouts, setAvailableLayouts] = useState({});

  const [userRole, setUserRole] = useState(null);
  const [pin, setPin] = useState('');
  const [availablePinningConfigs, setAvailablePinningConfigs] = useState([]);
  const [activePinningConfig, setActivePinningConfig] = useState('');
  const [activeLayout, setActiveLayout] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const appStateRef = useRef();
  appStateRef.current = { token, conferenceAlias, pin };
  const eventSourceRef = useRef(null);

  const isLecture = ['lecture', 'lecture_mode', 'lecture_type'].includes(conferenceType);

  // Release token on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const { token: currentToken, conferenceAlias: conf, pin: currentPin } = appStateRef.current || {};
      if (!currentToken || !conf) return;
      const apiUrl = `/api/client/v2/conferences/${conf}/release_token`;
      const headers = { 'Content-Type': 'application/json', token: currentToken, pin: currentPin || '' };
      try { navigator.sendBeacon && navigator.sendBeacon(apiUrl); } catch {}
      fetch(apiUrl, { method: 'POST', headers, keepalive: true }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Event source setup (unchanged, trimmed here for brevity)
  useEffect(() => {
    if (!isConnected || !token || !conferenceAlias) return;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    const url = `/api/client/v2/conferences/${conferenceAlias}/events?token=${token}`;
    console.log('Connecting to events at:', url);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('participant_create', (e) => {
      const p = JSON.parse(e.data);
      if (p.role === 'guest') {
        setGuests((prev) => (prev.some(x => x.uuid === p.uuid) ? prev : [...prev, p]).sort((a, b) => a.display_name.localeCompare(b.display_name)));
      } else {
        setParticipants((prev) => (prev.some(x => x.uuid === p.uuid) ? prev : [...prev, p]).sort((a, b) => a.display_name.localeCompare(b.display_name)));
      }
    });

    es.addEventListener('participant_update', (e) => {
      const p = JSON.parse(e.data);
      if (p.role === 'guest') setGuests((prev) => prev.map(x => x.uuid === p.uuid ? p : x));
      else setParticipants((prev) => prev.map(x => x.uuid === p.uuid ? p : x));
    });

    es.addEventListener('participant_delete', (e) => {
      const p = JSON.parse(e.data);
      if (p.role === 'guest') setGuests((prev) => prev.filter(x => x.uuid !== p.uuid));
      else setParticipants((prev) => prev.filter(x => x.uuid !== p.uuid));
    });

    es.addEventListener('conference_update', (e) => {
      const u = JSON.parse(e.data);
      setConferenceState((prev) => ({ ...prev, isLocked: u.locked, guestsMuted: u.guests_muted, guestsCanUnmute: u.guests_can_unmute }));
      if (u.pinning_config !== undefined) setActivePinningConfig(u.pinning_config);
    });

    es.addEventListener('layout', (e) => {
      const u = JSON.parse(e.data);
      if (u && u.view) setActiveLayout(u.view);
    });

    es.addEventListener('message_received', (e) => setMessages((prev) => [...prev, JSON.parse(e.data)]));

    es.addEventListener('presentation_start', () => setIsReceivingPresentation(true));
    es.addEventListener('presentation_stop', () => { setIsReceivingPresentation(false); setPresentationImageUrl(''); });

    es.addEventListener('disconnect', (e) => {
      try { alert(`Disconnected: ${JSON.parse(e.data).reason}`); } catch {}
      leave();
    });
    es.onerror = () => leave();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isConnected, token, conferenceAlias]);

  // Refresh token
  useEffect(() => {
    if (!isConnected || !token) return;
    const id = setTimeout(() => refreshToken(), tokenExpires * 1000 * 0.8);
    return () => clearTimeout(id);
  }, [isConnected, token, tokenExpires]);

  // Auto-open chat on first message
  useEffect(() => {
    if (messages.length === 1 && !isChatOpen) setIsChatOpen(true);
  }, [messages, isChatOpen]);

  // Helpers
  async function refreshToken() {
    const path = `/api/client/v2/conferences/${conferenceAlias}/refresh_token`;
    try {
      const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', token } });
      if (!res.ok) return leave();
      const data = await res.json();
      setToken(data.result.token);
      setTokenExpires(data.result.expires);
    } catch { leave(); }
  }

  // Toggle Conference Lock State
  async function lockToggle() {
    const newLockState = !conferenceState.isLocked; // Determine the new state
    const action = newLockState ? 'lock' : 'unlock';

    try {
      await apiPost(
        `/api/client/v2/conferences/${conferenceAlias}/${action}`,
        token
      );
      
      // Manually update local state optimistically, or wait for 'conference_update' event
      // Updating locally for responsiveness is often good practice:
      setConferenceState(prev => ({ ...prev, isLocked: newLockState }));
      
      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`);
    } catch (err) {
      console.error(`${action} conference error:`, err);
      toast.error(`Failed to ${action} conference`);
    }
  }
  // Login
  async function login({ conference, pin: pinIn, displayName }) {
    const path = `/api/client/v2/conferences/${conference}/request_token`;
    const body = { display_name: displayName, start_conference_if_host: true, direct_media: true, supports_direct_chat: true };
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', pin: pinIn || '' }, body: JSON.stringify(body) });
    const result = await res.json();
    if (!res.ok) throw new Error(result.result || JSON.stringify(result));

    const newToken = result.result.token;

    // 🔄 always set availableLayouts
    const layoutsDict = await loadAvailableLayouts(conference, newToken);
    setAvailableLayouts(layoutsDict);

    // Pinning configs
    const pinning = await apiGet(`/api/client/v2/conferences/${conference}/available_pinning_configs`, newToken).catch(() => null);
    if (pinning && pinning.result) setAvailablePinningConfigs(pinning.result);

    setToken(newToken);
    setPin(pinIn || '');
    setUserRole(result.result.role);
    setConferenceAlias(conference);
    setConferenceDisplayName(result.result.conference_name);
    setTokenExpires(result.result.expires || 120);
    setConferenceType(result.result.service_type);

    // initial participants
    const people = await apiGet(`/api/client/v2/conferences/${conference}/participants`, newToken).catch(() => null);
    if (people && people.result) {
      const all = Array.isArray(people.result) ? people.result : (people.result.participants || []);
      setParticipants(all.filter(p => p.role !== 'guest'));
      setGuests(all.filter(p => p.role === 'guest'));
    }
    setIsConnected(true);
  }

  // Leave (unchanged, clears everything)
  function leave() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (token && conferenceAlias) {
      apiPost(`/api/client/v2/conferences/${conferenceAlias}/release_token`, token).catch(() => {});
    }
    setIsConnected(false);
    setToken(null);
    setConferenceAlias('');
    setConferenceDisplayName('');
    setParticipants([]);
    setGuests([]);
    setConferenceState({ isLocked: false, guestsMuted: false, guestsCanUnmute: false });
    setMessages([]);
    if (presentationImageUrl) URL.revokeObjectURL(presentationImageUrl);
    setPresentationImageUrl('');
    setAvailableLayouts({});
    setUserRole(null);
    setPin('');
    setAvailablePinningConfigs([]);
    setActivePinningConfig('');
    setActiveLayout('');
  }

  // Transform layout
  function transformLayout({ layout, hostLayout, guestLayout, transforms }) {
    const body = {};
    if (conferenceType === "lecture") {
      if (hostLayout) body.host_layout = hostLayout;
      if (guestLayout) body.guest_layout = guestLayout;
    } else {
      if (layout) body.layout = layout;
    }
    if (transforms && Object.keys(transforms).length > 0) {
      body.transforms = transforms;
    }
    if (Object.keys(body).length === 0) {
      toast.error("No layout or transform selected");
      return;
    }
    fetch(`/api/client/v2/conferences/${conferenceAlias}/transform_layout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`POST /transform_layout -> ${res.status}`);
        return res.json();
      })
      .then(() => toast.success("Layout/Transform applied successfully!"))
      .catch((err) => {
        console.error("Transform layout error:", err);
        toast.error(`Failed to apply transform: ${err.message}`);
      });
  }

  // Reset layout
  async function resetTransformLayout() {
    try {
      await apiPostJSON(
        `/api/client/v2/conferences/${conferenceAlias}/transform_layout`,
        token,
        { transforms: {} }
      );
      setActiveLayout("");
      setAvailableLayouts({});
      toast.success("Layout has been reset");

      const layoutsDict = await loadAvailableLayouts(conferenceAlias, token);
      setAvailableLayouts(layoutsDict);
    } catch (err) {
      console.error("Failed to reset layout:", err);
      toast.error("Failed to reset layout");
    }
  }

  // … (other conference actions, participant actions, chat, toggleChat, etc. unchanged) …

  return {
    // state
    isConnected, token, tokenExpires, conferenceAlias, conferenceType, conferenceDisplayName,
    participants, guests, conferenceState, messages, isReceivingPresentation, presentationImageUrl,
    availableLayouts,
    userRole, pin, availablePinningConfigs, activePinningConfig, activeLayout, isChatOpen,
    isLecture,

    // core actions
    login, leave, refreshToken,

    // conference actions
    lockToggle, muteAllToggle, toggleGuestsCanUnmute, setBroadcastMessage, getBroadcastMessage, clearBroadcastMessage,
    dialOut, setPinningConfig, clearPinningConfig, transformLayout, resetTransformLayout,

    // participant actions
    muteToggle, disconnect, spotlightToggle, toggleVideoMute, toggleSeePresentation, setRole,
    createPersonalMix, configurePersonalMix, deletePersonalMix,

    // chat/ui
    sendMessage, toggleChat,
  };
}
