import { useState, useEffect } from "react";
import AuthStatus from "./components/AuthStatus";
import EventForm from "./components/EventForm";
import EventList from "./components/EventList";
import StatusLog from "./components/StatusLog";

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStatusUpdate = (message, type) => {
    if (window.addStatusLog) {
      window.addStatusLog(message, type);
    }
  };

  const handleEventsCreated = (events) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Initialize status log
  useEffect(() => {
    handleStatusUpdate("CalGen loaded", "info");
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h1 className="text-xl font-bold text-gray-900">
                CalGen
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">v2.0</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Auth & Form */}
          <div className="lg:col-span-2 space-y-6">
            <AuthStatus />
            <EventForm
              onEventsCreated={handleEventsCreated}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>

          {/* Right Column - Status Log */}
          <div className="space-y-6">
            <StatusLog />
          </div>
        </div>

        {/* Bottom Section - Events List */}
        <div className="mt-8">
          <EventList
            refreshTrigger={refreshTrigger}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-2 sm:mb-0">
              Made with ❤️ for humor-filled calendars
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>•</span>
              <a href="/auth" className="hover:text-gray-700 transition-colors">
                Re-authorize
              </a>
              <span>•</span>
              <button
                onClick={() => window.location.reload()}
                className="hover:text-gray-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
