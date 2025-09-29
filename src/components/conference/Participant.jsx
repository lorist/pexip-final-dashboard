import React, { useState } from 'react';

const Participant = ({
  participant,
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
  const {
    display_name,
    role,
    is_muted,
    uuid,
    is_video_muted,
    rx_presentation_policy,
    spotlight,
    is_presenting,
    can_receive_personal_mix,
    receive_from_video_mix,
  } = participant;
  
  const [personalMixLayout, setPersonalMixLayout] = useState('1:7');
  
  const isMutedBool = is_muted === 'YES';
  const isVideoMutedBool = is_video_muted;
  const canSeePresentation = rx_presentation_policy === 'ALLOW';
  const isSpotlit = spotlight !== 0;
  const canControlActions = userRole === 'HOST';
  const isPresenting = is_presenting === 'YES';
  const isUsingMainMix = receive_from_video_mix?.mix_name === 'main';

  const handleConfigure = () => {
    onConfigurePersonalMix(uuid, personalMixLayout);
  };

  // --- Button classes (unchanged) ---
  const baseButtonClasses = "rounded-md py-2 px-3 text-xs font-medium transition";
  const primaryButtonClasses = `${baseButtonClasses} bg-primary text-white hover:bg-opacity-90`;
  const dangerButtonClasses = `${baseButtonClasses} bg-danger text-white hover:bg-opacity-90`;
  const secondaryButtonClasses = `${baseButtonClasses} bg-gray-200 text-black hover:bg-gray-300 dark:bg-graydark dark:text-white dark:hover:bg-opacity-90`;
  const setGuestButtonClasses = `${baseButtonClasses} rounded-r-md bg-gray-200 text-black hover:bg-gray-300 dark:bg-bodydark dark:text-white disabled:opacity-50`;
  const setHostButtonClasses = `${baseButtonClasses} rounded-l-md bg-success text-white disabled:opacity-50`;

  const mutedStatusClasses = "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200";
  const unmutedStatusClasses = "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200";
  
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-gray-2 dark:bg-meta-4 p-4">
      <div className="flex grow items-center gap-3 min-w-0">
        <div className="min-w-0"> 
          <p className="font-medium text-black dark:text-white truncate">
            {isSpotlit ? '🌟' : ''} {display_name}
          </p>
          <p className="text-sm text-bodydark2">{role}</p>
        </div>
        
        <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${isMutedBool ? mutedStatusClasses : unmutedStatusClasses}`}>
          {isMutedBool ? 'Muted' : 'Unmuted'}
        </span>
        
        {isPresenting && (
          <span className="text-xs px-2 py-1 rounded-full shrink-0 bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Presenting
          </span>
        )}
      </div>
      
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {isUsingMainMix ? (
          <button
            onClick={() => onCreatePersonalMix(uuid)}
            disabled={!can_receive_personal_mix}
            className={primaryButtonClasses}
          >
            Personal Layout
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={personalMixLayout}
              onChange={(e) => setPersonalMixLayout(e.target.value)}
              className="rounded-md bg-gray-3 dark:bg-form-input p-2 text-sm"
            >
              {Object.keys(availableLayouts).map((layoutKey) => (
                <option key={layoutKey} value={layoutKey}>
                  {availableLayouts[layoutKey] || layoutKey}
                </option>
              ))}
            </select>
            <button onClick={handleConfigure} className={primaryButtonClasses}>Configure</button>
            <button onClick={() => onDeletePersonalMix(uuid)} className={secondaryButtonClasses}>Delete Mix</button>
          </div>
        )}
        <button onClick={() => onToggleVideoMute(uuid)} className={primaryButtonClasses}>
          {isVideoMutedBool ? 'Unmute Video' : 'Mute Video'}
        </button>
        <button onClick={() => onToggleSeePresentation(uuid)} className={secondaryButtonClasses} disabled={!canControlActions}>
          {canSeePresentation ? 'Deny Pres.' : 'Allow Pres.'}
        </button>
        <button onClick={() => onSpotlightToggle(uuid)} disabled={!canControlActions} className={`${primaryButtonClasses} ${isSpotlit ? 'bg-warning' : ''}`}>
          {isSpotlit ? 'Remove Spotlight' : 'Add Spotlight'}
        </button>
        <div className="flex rounded-md shadow-sm">
          <button onClick={() => onSetRole(uuid, 'chair')} disabled={!canControlActions || role === 'chair'} className={setHostButtonClasses}>Set Host</button>
          <button onClick={() => onSetRole(uuid, 'guest')} disabled={!canControlActions || role === 'guest'} className={setGuestButtonClasses}>Set Guest</button>
        </div>
        <button onClick={() => onDisconnect(uuid)} className={dangerButtonClasses}>Disconnect</button>
      </div>
    </div>
  );
};

export default Participant;
