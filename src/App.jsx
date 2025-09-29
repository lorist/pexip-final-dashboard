import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './layout/AppLayout.tsx';
import ConnectionForm from './components/forms/ConnectionForm';
import Roster from './components/conference/Roster';
import ConferenceControls from './components/conference/ConferenceControls';
import Chat from './components/conference/Chat';
import Presentation from './components/conference/Presentation';
import DialOutForm from './components/conference/DialOutForm';
import PinningConfigForm from './components/conference/PinningConfigForm';
import TransformLayoutForm from './components/conference/TransformLayoutForm';
// import TextOverlayControls from './components/conference/TextOverlayControls'; // leaving this out for now

import useConference from './hooks/useConference';

function App() {
  const c = useConference();

  const DashboardContent = () => (
    <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
      <main
        className={`col-span-12 ${
          c.isChatOpen ? 'lg:col-span-8' : ''
        } flex flex-col gap-4`}
      >
        {/* Presentation */}
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <Presentation
            isReceivingPresentation={c.isReceivingPresentation}
            imageUrl={c.presentationImageUrl}
          />
        </div>

        {/* Hosts */}
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <Roster
            title="Hosts"
            participants={c.participants}
            availableLayouts={c.availableLayouts}
            userRole={c.userRole}
            onMuteToggle={c.muteToggle}
            onDisconnect={c.disconnect}
            onCreatePersonalMix={c.createPersonalMix}
            onConfigurePersonalMix={c.configurePersonalMix}
            onDeletePersonalMix={c.deletePersonalMix}
            onSpotlightToggle={c.spotlightToggle}
            onToggleVideoMute={c.toggleVideoMute}
            onToggleSeePresentation={c.toggleSeePresentation}
            onSetRole={c.setRole}
          />
        </div>

        {/* Guests (lecture mode only) */}
        {c.isLecture && (
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <Roster
              title="Guests"
              participants={c.guests}
              availableLayouts={c.availableLayouts}
              userRole={c.userRole}
              onMuteToggle={c.muteToggle}
              onDisconnect={c.disconnect}
              onCreatePersonalMix={c.createPersonalMix}
              onConfigurePersonalMix={c.configurePersonalMix}
              onDeletePersonalMix={c.deletePersonalMix}
              onSpotlightToggle={c.spotlightToggle}
              onToggleVideoMute={c.toggleVideoMute}
              onToggleSeePresentation={c.toggleSeePresentation}
              onSetRole={c.setRole}
            />
          </div>
        )}

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Conference Controls */}
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <ConferenceControls
              isLocked={c.conferenceState.isLocked}
              onLockToggle={c.lockToggle}
              guestsMuted={c.conferenceState.guestsMuted}
              onMuteAllToggle={c.muteAllToggle}
              onSetBroadcastMessage={c.setBroadcastMessage}
              onGetBroadcastMessage={c.getBroadcastMessage}
              onClearBroadcastMessage={c.clearBroadcastMessage}
              guestsCanUnmute={c.conferenceState.guestsCanUnmute}
              onToggleGuestsCanUnmute={c.toggleGuestsCanUnmute}
            />
          </div>

          {/* Transform Layout */}
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h3 className="font-semibold text-black dark:text-white mb-4">
                  Layout Transformation
              </h3>
              <TransformLayoutForm
                  conferenceType={c.conferenceType}
                  availableLayouts={c.availableLayouts} // Pass the single array for both cases
                  onTransformLayout={c.transformLayout}
                  onResetLayout={c.resetTransformLayout}
              />
          </div>

          {/* Pinning Config */}
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="font-semibold text-black dark:text-white mb-4">
              Pinning Configurations
            </h3>
            <PinningConfigForm
              availableConfigs={c.availablePinningConfigs}
              activeConfig={c.activePinningConfig}
              onSetPinningConfig={c.setPinningConfig}
              onClearPinningConfig={c.clearPinningConfig}
            />
          </div>

          {/* Dial Out */}
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="font-semibold text-black dark:text-white mb-4">
              Dial Out
            </h3>
            <DialOutForm onDialOut={c.dialOut} />
          </div>
        </div>
      </main>

      {/* Chat Sidebar */}
      {c.isChatOpen && (
        <aside className="col-span-12 lg:col-span-4 h-full">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark h-full flex flex-col">
            <Chat messages={c.messages} onSendMessage={c.sendMessage} />
          </div>
        </aside>
      )}
    </div>
  );

  return (
    <Routes>
      {c.isConnected ? (
        <Route
          element={
            <AppLayout
              onLeave={c.leave}
              onToggleChat={c.toggleChat}
              conferenceDisplayName={c.conferenceDisplayName}
            />
          }
        >
          <Route path="/" element={<DashboardContent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <>
          <Route path="/login" element={<ConnectionForm onLogin={c.login} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

export default App;
