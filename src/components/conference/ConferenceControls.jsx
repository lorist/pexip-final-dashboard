import React from "react";

const ConferenceControls = ({
  isLocked,
  onLockToggle,
  guestsMuted,
  onMuteAllToggle,
  onSetBroadcastMessage,
  onGetBroadcastMessage,
  onClearBroadcastMessage,
  guestsCanUnmute,
  onToggleGuestsCanUnmute,
}) => {
  return (
    <div className="space-y-4">
      {/* Lock/Unlock */}
      <div>
        <button
          onClick={onLockToggle}
          className="w-full rounded bg-primary p-2 text-white hover:bg-opacity-90"
        >
          {isLocked ? "Unlock Conference" : "Lock Conference"}
        </button>
      </div>

      {/* Mute/Unmute All */}
      <div>
        <button
          onClick={onMuteAllToggle}
          className="w-full rounded bg-primary p-2 text-white hover:bg-opacity-90"
        >
          {guestsMuted ? "Unmute All Guests" : "Mute All Guests"}
        </button>
      </div>

      {/* Guests Can Unmute */}
      <div>
        <button
          onClick={onToggleGuestsCanUnmute}
          className="w-full rounded bg-primary p-2 text-white hover:bg-opacity-90"
        >
          {guestsCanUnmute ? "Disallow Guests to Unmute" : "Allow Guests to Unmute"}
        </button>
      </div>

      {/* Broadcast Message */}
      <div className="space-y-2">
        <button
          onClick={onSetBroadcastMessage}
          className="w-full rounded bg-primary p-2 text-white hover:bg-opacity-90"
        >
          Set Broadcast Message
        </button>
        <button
          onClick={onGetBroadcastMessage}
          className="w-full rounded bg-graydark p-2 text-white hover:bg-opacity-90"
        >
          Get Broadcast Message
        </button>
        <button
          onClick={onClearBroadcastMessage}
          className="w-full rounded bg-graydark p-2 text-white hover:bg-opacity-90"
        >
          Clear Broadcast Message
        </button>
      </div>
    </div>
  );
};

export default ConferenceControls;
