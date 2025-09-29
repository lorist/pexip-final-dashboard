// src/components/conference/Roster.jsx

import React from 'react';
import Participant from './Participant';

const Roster = ({
  title,
  participants = [],
  availableLayouts,
  userRole,
  onMuteToggle,
  onDisconnect,
  onCreatePersonalMix,
  onConfigurePersonalMix,
  onDeletePersonalMix,
  onSpotlightToggle,
  onToggleVideoMute,
  onToggleSeePresentation,
  onSetRole,
}) => {
  console.log(`[Roster] Rendering "${title}" with participants:`, participants);

  if (!participants || participants.length === 0) {
    return (
      <div>
        <h3 className="font-semibold text-black dark:text-white mb-4">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">No participants</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold text-black dark:text-white mb-4">{title}</h3>
      <div className="flex flex-col gap-3">
        {participants.map((p) => (
          <Participant
            key={p.uuid || p.api_url}
            participant={{
              ...p,
              display_name: p.display_name || "Unnamed Participant",
            }}
            availableLayouts={availableLayouts}
            userRole={userRole}
            onMuteToggle={onMuteToggle}
            onDisconnect={onDisconnect}
            onCreatePersonalMix={onCreatePersonalMix}
            onConfigurePersonalMix={onConfigurePersonalMix}
            onDeletePersonalMix={onDeletePersonalMix}
            onSpotlightToggle={onSpotlightToggle}
            onToggleVideoMute={onToggleVideoMute}
            onToggleSeePresentation={onToggleSeePresentation}
            onSetRole={onSetRole}
          />
        ))}
      </div>
    </div>
  );
};

export default Roster;
