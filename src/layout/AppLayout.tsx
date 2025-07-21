// src/layout/AppLayout.tsx

import { Outlet } from 'react-router-dom';
// Import the pre-built theme toggle button
import { ThemeToggleButton } from '../components/common/ThemeToggleButton';

const AppLayout = ({ onLeave, onToggleChat, conferenceDisplayName }) => {
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          
          <header className="sticky top-0 z-50 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
            <div className="flex flex-grow items-center justify-between py-4 px-4 shadow-2 md:px-6 2xl:px-11">
              <div className="flex items-center gap-2 sm:gap-4">
                <h1 className="text-xl font-bold text-black dark:text-white">
                  Dashboard: <span className="text-primary">{conferenceDisplayName}</span>
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Add the ThemeToggleButton here */}
                <ThemeToggleButton />
                
                <button
                  onClick={onToggleChat}
                  className="rounded-md bg-primary py-2 px-4 text-sm font-medium text-white transition hover:bg-opacity-90"
                >
                  Chat
                </button>
                <button
                  onClick={onLeave}
                  className="rounded-md bg-danger py-2 px-4 text-sm font-medium text-white transition hover:bg-opacity-90"
                >
                  Leave Conference
                </button>
              </div>
            </div>
          </header>

          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              <Outlet />
            </div>
          </main>
          
        </div>
      </div>
    </div>
  );
};

export default AppLayout;