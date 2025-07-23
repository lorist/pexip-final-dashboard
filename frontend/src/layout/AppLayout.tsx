// src/layout/AppLayout.tsx

import React, { ReactNode, useEffect, useState } from 'react'; // Import useState and useEffect
import { useLocation } from 'react-router-dom';
// Import the pre-built theme toggle button
import { ThemeToggleButton } from '../components/common/ThemeToggleButton';

interface AppLayoutProps {
  children?: ReactNode;
  onLeave: () => void;
  onToggleChat: () => void;
  conferenceDisplayName: string;
  // ... any other props your AppLayout takes
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, onLeave, onToggleChat, conferenceDisplayName }) => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize dark mode based on localStorage or system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      return true;
    } else {
      document.documentElement.classList.remove('dark');
      return false;
    }
  });

  // Effect to apply/remove 'dark' class on html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [isDarkMode]);

  // Function to toggle theme
  const handleThemeToggle = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const showConferenceButtons = location.pathname === '/' && !!conferenceDisplayName;

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          
          <header className="sticky top-0 z-50 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
            <div className="flex flex-grow items-center justify-between py-4 px-4 shadow-2 md:px-6 2xl:px-11">
              <div className="flex items-center gap-2 sm:gap-4">
                <h1 className="text-xl font-bold text-black dark:text-white">
                  {location.pathname === '/' ? `Dashboard: ${conferenceDisplayName}` : 'Active Conferences Overview'}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Pass the handleThemeToggle function to ThemeToggleButton */}
                <ThemeToggleButton onToggle={handleThemeToggle} />
                
                {showConferenceButtons && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </header>

          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
          
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
