import { useEffect, useRef, useState } from 'react';
import { apiGet, apiPost, apiPostJSON } from '../api/pexipClient';
import toast from "react-hot-toast";

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

  const [availableLayouts, setAvailableLayouts] = useState([]);

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

  // Event source
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

    const onCreate = (p) => {
      if (p.role === 'guest') {
        setGuests((prev) =>
          (prev.some(x => x.uuid === p.uuid) ? prev : [...prev, p])
            .sort((a, b) => a.display_name.localeCompare(b.display_name))
        );
      } else {
        setParticipants((prev) =>
          (prev.some(x => x.uuid === p.uuid) ? prev : [...prev, p])
            .sort((a, b) => a.display_name.localeCompare(b.display_name))
        );
      }
    };
    const onUpdate = (p) => {
      if (p.role === 'guest') setGuests((prev) => prev.map(x => x.uuid === p.uuid ? p : x));
      else setParticipants((prev) => prev.map(x => x.uuid === p.uuid ? p : x));
    };
    const onDelete = (p) => {
      if (p.role === 'guest') setGuests((prev) => prev.filter(x => x.uuid !== p.uuid));
      else setParticipants((prev) => prev.filter(x => x.uuid !== p.uuid));
    };

    es.addEventListener('participant_create', (e) => onCreate(JSON.parse(e.data)));
    es.addEventListener('participant_update', (e) => onUpdate(JSON.parse(e.data)));
    es.addEventListener('participant_delete', (e) => onDelete(JSON.parse(e.data)));

    es.addEventListener('conference_update', (e) => {
      const u = JSON.parse(e.data);
      setConferenceState((prev) => ({
        ...prev,
        isLocked: u.locked,
        guestsMuted: u.guests_muted,
        guestsCanUnmute: u.guests_can_unmute
      }));
      if (u.pinning_config !== undefined) setActivePinningConfig(u.pinning_config);
    });

    es.addEventListener('layout', (e) => {
      const u = JSON.parse(e.data);
      if (u && u.layout) { 
          setActiveLayout(u.layout); 
      }
    });

    es.addEventListener('message_received', (e) =>
      setMessages((prev) => [...prev, JSON.parse(e.data)])
    );

    es.addEventListener('presentation_start', () => setIsReceivingPresentation(true));
    es.addEventListener('presentation_stop', () => {
      setIsReceivingPresentation(false);
      setPresentationImageUrl('');
    });

    es.addEventListener('presentation_frame', async (e) => {
      const imgUrl = `/api/client/v2/conferences/${conferenceAlias}/presentation.jpeg?id=${e.lastEventId}`;
      try {
        const r = await fetch(imgUrl, { method: 'GET', headers: { token } });
        if (r.ok) {
          const blob = await r.blob();
          const url = URL.createObjectURL(blob);
          setPresentationImageUrl((old) => {
            if (old) URL.revokeObjectURL(old);
            return url;
          });
        }
      } catch (err) {
        console.error('presentation_frame fetch failed', err);
      }
    });

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

  // Conference actions
  function lockToggle() {
    const path = `/api/client/v2/conferences/${conferenceAlias}/${conferenceState.isLocked ? 'unlock' : 'lock'}`;
    apiPost(path, token).catch(console.error);
  }

  function muteAllToggle() {
    const path = `/api/client/v2/conferences/${conferenceAlias}/${conferenceState.guestsMuted ? 'unmuteguests' : 'muteguests'}`;
    apiPost(path, token).catch(console.error);
  }

  function toggleGuestsCanUnmute() {
    const path = `/api/client/v2/conferences/${conferenceAlias}/set_guests_can_unmute`;
    apiPostJSON(path, token, { setting: !conferenceState.guestsCanUnmute }).catch(console.error);
  }

  function setBroadcastMessage() {
    const text = window.prompt('Enter the message to display to all participants:');
    if (text !== null) {
      apiPostJSON(`/api/client/v2/conferences/${conferenceAlias}/set_message_text`, token, { text }).catch(console.error);
    }
  }

  async function getBroadcastMessage() {
    try {
      const res = await apiGet(`/api/client/v2/conferences/${conferenceAlias}/get_message_text`, token);
      alert(`Current broadcast message:\n\n${(res && res.result && res.result.text) || 'No message is set.'}`);
    } catch {
      alert('Could not retrieve the current broadcast message.');
    }
  }

  function clearBroadcastMessage() {
    apiPostJSON(`/api/client/v2/conferences/${conferenceAlias}/set_message_text`, token, {}).catch(console.error);
  }
    // Dial out
  function dialOut(dialData) {
    const headers = { 'Content-Type': 'application/json', token };
    const path = `/api/client/v2/conferences/${conferenceAlias}/dial`;
    fetch(path, { method: 'POST', headers, body: JSON.stringify(dialData) }).catch(console.error);
  }

  // Pinning config
  function setPinningConfig(configName) {
    apiPostJSON(`/api/client/v2/conferences/${conferenceAlias}/set_pinning_config`, token, { pinning_config: configName }).catch(console.error);
  }
  function clearPinningConfig() {
    apiPostJSON(`/api/client/v2/conferences/${conferenceAlias}/set_pinning_config`, token, { pinning_config: '' }).catch(console.error);
  }


  // Login
  async function login({ conference, pin: pinIn, displayName }) {
    const path = `/api/client/v2/conferences/${conference}/request_token`;
    const body = {
      display_name: displayName,
      start_conference_if_host: true,
      direct_media: true,
      supports_direct_chat: true
    };
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', pin: pinIn || '' },
      body: JSON.stringify(body)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.result || JSON.stringify(result));

    const newToken = result.result.token;

    // Load layouts
    const layouts = await apiGet(
      `/api/client/v2/conferences/${conference}/available_layouts`,
      newToken
    ).catch(() => null);

    console.log("Available layouts response:", JSON.stringify(layouts, null, 2));

    if (layouts && Array.isArray(layouts.result)) {
      setAvailableLayouts(layouts.result); // ✅ always array
    }

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

    // Initial participants
    const people = await apiGet(`/api/client/v2/conferences/${conference}/participants`, newToken).catch(() => null);
    if (people && people.result) {
      const all = Array.isArray(people.result) ? people.result : (people.result.participants || []);
      setParticipants(all.filter(p => p.role !== 'guest'));
      setGuests(all.filter(p => p.role === 'guest'));
    }
    setIsConnected(true);
  }
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
    setAvailableLayouts([]); // ✅ now array only
    setUserRole(null);
    setPin('');
    setAvailablePinningConfigs([]);
    setActivePinningConfig('');
    setActiveLayout('');
  }

  // Transform layout
  // useConference.js (The complete transformLayout function)

  function transformLayout({ layout, hostLayout, guestLayout, transforms }) {
    const body = {};
    let cleanTransforms = {};

    // Handle Layouts (Lecture vs. Non-Lecture)
    if (isLecture) {
      console.log("TransformLayout → Lecture mode (Allowing individual host/guest layout sets)");

      // ONLY add the layout keys that are actually present
      if (hostLayout) {
        cleanTransforms.host_layout = hostLayout;
      }
      if (guestLayout) {
        cleanTransforms.guest_layout = guestLayout;
      }

    } else if (layout) {
      console.log("TransformLayout → Single layout mode");
      // For non-lecture mode, the general layout key is used
      cleanTransforms.layout = layout;
    }
    
    // 2. Process Text Overlays
    // if (transforms && transforms.text_overlay) {
    //   if (typeof transforms.text_overlay.text === "string") {
    //       // NOTE: We don't need to check .trim() !== "" here. 
    //       // Sending an empty string "" will clear the overlay on the server.
          
    //       cleanTransforms.text_overlay = {
    //           text: transforms.text_overlay.text,
    //           position: transforms.text_overlay.position || "top",
    //           size: transforms.text_overlay.size || "medium",
    //       };
    //   }
    // }

    // Process Text Overlays (Merge with existing cleanTransforms)
    if (transforms && transforms.text_overlay) {
      if (typeof transforms.text_overlay.text === "string" && transforms.text_overlay.text.trim() !== "") {
        cleanTransforms.text_overlay = {
          text: transforms.text_overlay.text,
          position: transforms.text_overlay.position || "top",
          size: transforms.text_overlay.size || "medium",
        };
      }
    }

    // FINAL CRITICAL STEP: Add cleanTransforms (which holds the layout and/or text) 
    // to the body under the 'transforms' key.
    if (Object.keys(cleanTransforms).length > 0) {
        body.transforms = cleanTransforms;
    }
    
    // Final check
    if (Object.keys(body).length === 0) {
      toast.error("No valid layout or transform selected");
      return;
    }

    console.log("Sending FINAL body (Layout in Transforms):", JSON.stringify(body, null, 2));
    
    fetch(`/api/client/v2/conferences/${conferenceAlias}/transform_layout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`POST /transform_layout -> ${res.status}`);
        return res.json();
      })
      .then((result) => {
        console.log("Transform layout success:", result);
        toast.success("Layout applied successfully!");
      })
      .catch((err) => {
        console.error("Transform layout error:", err);
        toast.error(`Failed to apply transform: ${err.message}`);
      });
  }

  // Selected layout state
  const [selectedHostLayout, setSelectedHostLayout] = useState("");
  const [selectedGuestLayout, setSelectedGuestLayout] = useState("");
  const [selectedLayout, setSelectedLayout] = useState("");

  function onSetHostLayout(layoutKey) {
    setSelectedHostLayout(layoutKey);
    if (layoutKey) transformLayout({ hostLayout: layoutKey });
  }

  function onSetGuestLayout(layoutKey) {
    setSelectedGuestLayout(layoutKey);
    if (layoutKey) transformLayout({ guestLayout: layoutKey });
  }

  function onSetLayout(layoutKey) {
    setSelectedLayout(layoutKey);
    if (layoutKey && layoutKey.trim() !== "") {
      transformLayout({ layout: layoutKey });
    }
  }

  function resetTransformLayout() {
    const body = { transforms: {} };

    fetch(`/api/client/v2/conferences/${conferenceAlias}/transform_layout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`POST /transform_layout -> ${res.status}`);
        return res.json();
      })
      .then(() => {
        setSelectedHostLayout("");
        setSelectedGuestLayout("");
        setSelectedLayout("");
        toast.success("Layouts and transforms have been reset");
      })
      .catch((err) => {
        console.error("Failed to reset transforms:", err);
        toast.error("Failed to reset transforms");
      });
  }




  // Participant actions
    // Personal mixes
  function createPersonalMix(participantId) {
    apiPostJSON(`/api/client/v2/conferences/${conferenceAlias}/video_mixes/create`, token, { mix_name: `main.!${participantId}` }).catch(console.error);
  }
  function configurePersonalMix(participantId, layout) {
    apiPostJSON(`/api/client/v2/conferences/${conferenceAlias}/video_mixes/main.!${participantId}/configure`, token, { transform_layout: { layout } }).catch(console.error);
  }
  function deletePersonalMix(participantId) {
    apiPost(`/api/client/v2/conferences/${conferenceAlias}/video_mixes/main.!${participantId}/delete`, token).catch(console.error);
  }

  function getP(uuid) { return [...participants, ...guests].find(p => p.uuid === uuid); }
  function muteToggle(participantId) {
    const p = getP(participantId); if (!p) return;
    apiPost(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/${p.is_muted === 'YES' ? 'unmute' : 'mute'}`, token).catch(console.error);
  }
  function disconnect(participantId) {
    apiPost(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/disconnect`, token).catch(console.error);
  }
  function spotlightToggle(participantId) {
    const p = getP(participantId); if (!p) return;
    apiPost(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/${p.spotlight !== 0 ? 'spotlightoff' : 'spotlighton'}`, token).catch(console.error);
  }
  function toggleVideoMute(participantId) {
    const p = getP(participantId); if (!p) return;
    apiPost(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/${p.is_video_muted ? 'video_unmuted' : 'video_muted'}`, token).catch(console.error);
  }
  function toggleSeePresentation(participantId) {
    const p = getP(participantId); if (!p) return;
    apiPost(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/${p.rx_presentation_policy === 'ALLOW' ? 'denyrxpresentation' : 'allowrxpresentation'}`, token).catch(console.error);
  }
  function setRole(participantId, role) {
    apiPostJSON(`/api/client/v2/conferences/${conferenceAlias}/participants/${participantId}/role`, token, { role }).catch(console.error);
  }

  // Chat
  function sendMessage(messageText) {
    const localMessage = { origin: 'Me', payload: messageText };
    setMessages(prev => [...prev, localMessage]);
    apiPostJSON(`/api/client/v2/conferences/${conferenceAlias}/message`, token, { payload: messageText }).catch(console.error);
  }
  function toggleChat() { setIsChatOpen(!isChatOpen); }

  // function setTextOverlay({ text, position = 'top', size = 'medium' }) {
  //   if (!text || text.trim() === "") {
  //     toast.error("Text content cannot be empty.");
  //     return;
  //   }
    
  //   // Calls the existing transformLayout function with only the transforms object
  //   transformLayout({
  //     transforms: {
  //       text_overlay: {
  //         text,
  //         position,
  //         size
  //       }
  //     }
  //   });
  // }

  // function clearTextOverlay() {
  //   // Clears the overlay by sending an empty text value.
  //   // The transformLayout logic handles the omission of empty text fields.
  //   transformLayout({
  //     transforms: {
  //       text_overlay: {
  //         text: ""
  //       }
  //     }
  //   });
  // }
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
    lockToggle,
    muteAllToggle,
    toggleGuestsCanUnmute,
    setBroadcastMessage,
    getBroadcastMessage,
    clearBroadcastMessage,
    dialOut, setPinningConfig, clearPinningConfig, transformLayout, resetTransformLayout,

    // layout handlers
    onSetHostLayout,
    onSetGuestLayout,
    onSetLayout,
    selectedHostLayout,
    selectedGuestLayout,
    selectedLayout,
    // setTextOverlay,
    // clearTextOverlay,
    // participant actions
    muteToggle, disconnect, spotlightToggle, toggleVideoMute, toggleSeePresentation, setRole,
    createPersonalMix, configurePersonalMix, deletePersonalMix,

    // chat/ui
    sendMessage, toggleChat,
  };
}