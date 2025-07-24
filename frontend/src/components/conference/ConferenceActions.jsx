// src/components/conference/ConferenceActions.jsx

import React, { useState } from 'react'; // Import useState for local state management

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
  // State for the message input field
  const [messageInput, setMessageInput] = useState('');
  // State to display the fetched broadcast message
  const [displayedMessage, setDisplayedMessage] = useState('');

  // Helper function to handle setting the message
  const handleSetMessage = () => {
    if (messageInput.trim()) {
      onSetBroadcastMessage(messageInput);
      setMessageInput(''); // Clear input after sending
    }
  };

  // Helper function to handle getting the message
  const handleGetMessage = async () => {
    // onGetBroadcastMessage is an async function that logs the message.
    // We need to modify it slightly to return the message so we can display it.
    // For now, we'll assume it returns the message or you'll modify App.jsx later.
    // If onGetBroadcastMessage only logs, you'll need to update App.jsx's handleGetBroadcastMessage
    // to return the message.
    const message = await onGetBroadcastMessage(); // Assuming it returns the message
    if (message) {
      setDisplayedMessage(message);
    } else {
      setDisplayedMessage('No broadcast message set.');
    }
  };

  // Helper function to handle clearing the message
  const handleClearMessage = () => {
    onClearBroadcastMessage();
    setDisplayedMessage(''); // Clear displayed message
  };

  const buttonClasses = "flex w-full justify-center rounded bg-primary p-3 font-medium text-white hover:bg-opacity-90";
  const secondaryButtonClasses = `${buttonClasses} bg-graydark`;
  const positiveButtonClasses = `${buttonClasses} bg-success`;
  const negativeButtonClasses = `${buttonClasses} bg-danger`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Conference Lock/Mute Controls */}
      <button onClick={onLockToggle} className={isLocked ? negativeButtonClasses : buttonClasses}>
        {isLocked ? 'Unlock Conference' : 'Lock Conference'}
      </button>
      <button onClick={onMuteAllToggle} className={guestsMuted ? negativeButtonClasses : buttonClasses}>
        {guestsMuted ? 'Unmute All Guests' : 'Mute All Guests'}
      </button>
      <button onClick={onToggleGuestsCanUnmute} className={guestsCanUnmute ? positiveButtonClasses : negativeButtonClasses}>
        {guestsCanUnmute ? 'Guests Can Unmute' : 'Guests Cannot Unmute'}
      </button>

      {/* Broadcast Message Controls */}
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
