// src/layout/AppLayout.tsx

import React, { useState, ReactNode } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation

interface AppLayoutProps {
  children: ReactNode;
  onLeave: () => void;
  onToggleChat: () => void;
  conferenceDisplayName: string;
  isConnected: boolean; // Prop to indicate connection status
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  onLeave,
  onToggleChat,
  conferenceDisplayName,
  isConnected,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Assuming sidebar state is managed here

  // ADDED: Console log to confirm isConnected value inside AppLayout
  console.log('AppLayout: isConnected prop received:', isConnected);

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-999 flex w-full bg-white dark:bg-boxdark shadow-md">
        <div className="flex flex-grow items-center justify-between py-4 px-4 shadow-2 md:px-6 2xl:px-11">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
            <button
              aria-controls="sidebar"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
            >
              {/* Hamburger icon - replace with actual SVG if needed */}
              <span className="relative block h-5.5 w-5.5 cursor-pointer">
                <span className="absolute right-0 h-full w-full animate-pulse">
                  <span className="relative top-0 left-0 block h-0.5 w-full rounded-sm bg-black dark:bg-white"></span>
                  <span className="relative top-2.5 left-0 block h-0.5 w-full rounded-sm bg-black dark:bg-white"></span>
                  <span className="relative top-5 left-0 block h-0.5 w-full rounded-sm bg-black dark:bg-white"></span>
                </span>
              </span>
            </button>
            <Link className="block flex-shrink-0 lg:hidden" to="/">
              <h1 className="text-xl font-bold text-black dark:text-white">Pexip Dashboard</h1>
            </Link>
          </div>

          {/* Desktop Logo/Title (visible on larger screens) */}
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-black dark:text-white">
              {conferenceDisplayName ? `Conference: ${conferenceDisplayName}` : 'Pexip Dashboard'}
            </h1>
          </div>

          {/* Navigation Menu */}
          <nav className="flex items-center gap-4">
            <Link
              to="/active-conferences"
              className="text-primary hover:text-primary-dark font-medium px-3 py-2 rounded-md transition-colors duration-200"
            >
              Active Conferences
            </Link>
            {isConnected ? (
              <Link
                to="/"
                className="text-primary hover:text-primary-dark font-medium px-3 py-2 rounded-md transition-colors duration-200"
              >
                My Conference
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-primary hover:text-primary-dark font-medium px-3 py-2 rounded-md transition-colors duration-200"
              >
                Login
              </Link>
            )}
          </nav>

          {/* Conditional Buttons (Chat and Leave) - Placed outside <nav> but still within header's flex container */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Explicitly check isConnected before rendering buttons */}
            {isConnected && (
              <> {/* Use a Fragment if multiple elements are conditionally rendered */}
                <button
                  onClick={onLeave}
                  className="px-4 py-2 bg-danger text-white rounded-md hover:bg-danger-dark transition-colors duration-200"
                >
                  Leave
                </button>
                <button
                  onClick={onToggleChat}
                  // CHANGED: Explicitly set a visible background and text color
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-md transition-colors duration-200"
                >
                  Toggle Chat
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      {/* End Header/Navbar */}

      {/* Main content area */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <main>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
