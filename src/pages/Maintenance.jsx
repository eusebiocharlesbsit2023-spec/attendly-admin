import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Maintenance.css";

export default function Maintenance() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // UI only (you can connect this to backend later)
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  const statusLabel = isMaintenanceMode ? "Maintenance" : "Online";
  const statusClass = isMaintenanceMode ? "status-red" : "status-green";

  const handleSwitch = () => {
    setIsMaintenanceMode((v) => !v);
  };

  return (
    <div className="mnt">
      {/* Sidebar */}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="maintenance" />

      {/* Top Bar */}
      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <button
              className="mnt-icon-btn"
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
            >
              <Svg name="menu" />
            </button>

            <div className="mnt-title">Maintenance</div>
          </div>

          <div className="mnt-topbar-right">
            <button className="mnt-icon-btn" type="button" aria-label="Notifications">
              <span className="mnt-notif-dot" />
              <Svg name="bell" />
            </button>

            <button
              className="mnt-icon-btn"
              type="button"
              aria-label="Logout"
              title="Logout"
              onClick={() => navigate("/")}
            >
              <Svg name="logout" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mnt-main">
        <section className="mnt-card">
          <h2 className="mnt-card-title">System Current Status</h2>

          <div className="mnt-status-row">
            <span className={`mnt-dot ${statusClass}`} />
            <span className="mnt-status-text">{statusLabel}</span>
          </div>

          <p className="mnt-desc">
            The Attendly system is currently undergoing scheduled maintenance to ensure stability,
            security, and proper operation. During this time, attendance recording and related
            services are temporarily unavailable. Users are advised to wait until the maintenance
            process is completed before accessing the application. Normal system operations will
            resume once maintenance has finished.
          </p>

          <button className="mnt-btn" type="button" onClick={handleSwitch}>
            {isMaintenanceMode ? "Switch to Online" : "Switch to Maintenance"}
          </button>
        </section>
      </main>
    </div>
  );
}

/* Inline icons (no libraries) */
function Svg({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (name) {
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "bell":
      return (
        <svg {...common}>
          <path
            d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M10 16l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 12h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 7a4 4 0 014 4v2a4 4 0 01-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
}
