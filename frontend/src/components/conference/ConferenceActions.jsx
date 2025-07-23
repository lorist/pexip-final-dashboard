// src/components/conference/ConferenceActions.jsx

import React from 'react';

const ConferenceActions = ({
  isLocked,
  onLockToggle,
  guestsMuted,
  onMuteAllToggle,
  onSetBroadcastMessage,
  onGetBroadcastMessage,
  onClearBroadcastMessage,
  guestsCanUnmute,
  onToggleGuestsCanUnmute
}) => {
  const buttonClasses = "flex w-full justify-center rounded bg-primary p-3 font-medium text-white hover:bg-opacity-90";
  const secondaryButtonClasses = `${buttonClasses} bg-graydark`;
  const positiveButtonClasses = `${buttonClasses} bg-success`;
  const negativeButtonClasses = `${buttonClasses} bg-danger`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <button onClick={onLockToggle} className={isLocked ? negativeButtonClasses : buttonClasses}>
        {isLocked ? 'Unlock Conference' : 'Lock Conference'}
      </button>
      <button onClick={onMuteAllToggle} className={guestsMuted ? negativeButtonClasses : buttonClasses}>
        {guestsMuted ? 'Unmute All Guests' : 'Mute All Guests'}
      </button>
      <button onClick={onToggleGuestsCanUnmute} className={guestsCanUnmute ? positiveButtonClasses : negativeButtonClasses}>
        {guestsCanUnmute ? 'Guests Can Unmute' : 'Guests Cannot Unmute'}
      </button>
      <button onClick={onSetBroadcastMessage} className={secondaryButtonClasses}>
        Set Message
      </button>
      <button onClick={onGetBroadcastMessage} className={secondaryButtonClasses}>
        Get Message
      </button>
      {/* New Button */}
      <button onClick={onClearBroadcastMessage} className={secondaryButtonClasses}>
        Clear Message
      </button>
    </div>
  );
};

export default ConferenceActions;