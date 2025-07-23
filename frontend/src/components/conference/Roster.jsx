// src/components/conference/Roster.jsx

import React from 'react';
import Participant from './Participant';

const Roster = ({
  participants,
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
  onTogglePresInMix,
  onSetRole,
}) => {
  const inConference = participants.filter(p => p.service_type === 'conference');

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold text-black dark:text-white">Roster ({inConference.length})</h3>
      {inConference.length > 0 ? (
        inConference.map(p => (
          <Participant
            key={p.uuid}
            participant={p}
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
            onTogglePresInMix={onTogglePresInMix}
            onSetRole={onSetRole}
          />
        ))
      ) : (
        <p className="text-bodydark2">No participants in the conference.</p>
      )}
    </div>
  );
};

export default Roster;