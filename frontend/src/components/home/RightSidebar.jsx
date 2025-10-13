import React from "react";
import {
  Home,
  Settings,
  Search,
  Bell,
  User,
  Calendar,
} from "lucide-react";

// Right-aligned persistent, non-collapsible rounded sidebar.
// Requires Tailwind CSS and lucide-react installed.

export default function PersistentRoundedSidebar({ className = "" }) {
  const items = [
    { id: "home", Icon: Home, label: "Home" },
    { id: "search", Icon: Search, label: "Search" },
    { id: "notifications", Icon: Bell, label: "Alerts" },
    { id: "profile", Icon: User, label: "Profile" },
    { id: "calendar", Icon: Calendar, label: "Calendar" },
    { id: "settings", Icon: Settings, label: "Settings" },
  ];

  return (
    <aside
      aria-label="Persistent right sidebar"
      className={`fixed right-4 top-4 h-[calc(100vh-2rem)] w-44 rounded-2xl bg-gray-900/95 shadow-2xl p-4 flex items-center justify-center ${className}`}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="grid grid-cols-3 grid-rows-2 gap-3 w-full">
          {items.map(({ id, Icon, label }) => (
            <button
              key={id}
              aria-label={label}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800/60 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 transition"
              title={label}
              onClick={() => {
                console.log(`${id} clicked`);
              }}
            >
              <Icon size={20} className="text-gray-200" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
