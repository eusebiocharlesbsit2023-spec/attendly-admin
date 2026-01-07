import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./Maintenance.css";
import MaintenanceConfirmModal from "../components/MaintenanceConfirmModal";
import ActivityHistoryModal from "../components/ActivityHistoryModal";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faBell, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

export default function Maintenance() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);
  const notifRef = useRef(null);

  // UI only (you can connect this to backend later)
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingNextMode, setPendingNextMode] = useState(null); // "maintenance" | "online"

  // ===== Activity (SAME AS ADMIN DASHBOARD) =====
  const [activityOpen, setActivityOpen] = useState(false);
  const activity = [
    { text: "John Smith marked attendance in CS101", time: "2 minutes ago" },
    { text: "Haylee Steinfield marked attendance in CS101", time: "5 minutes ago" },
    { text: "New Student enrolled: Emma Wilson", time: "2 hours ago" },
    { text: "Dakota Johnson marked attendance in CS201", time: "3 hours ago" },
    { text: "Professor Sadie Mayers created class CS102", time: "Yesterday" },
    { text: "Admin changed Alice Willson to Inactive", time: "2 days ago" },
    { text: "Maintenance switched to Online", time: "3 days ago" },
    { text: "Attendance export generated", time: "1 week ago" },
  ];

  const statusLabel = isMaintenanceMode ? "Maintenance" : "Online";
  const statusClass = isMaintenanceMode ? "status-red" : "status-green";

  const handleSwitch = () => {
    const next = isMaintenanceMode ? "online" : "maintenance";
    setPendingNextMode(next);
    setConfirmOpen(true);
  };

  const confirmYes = () => {
    setConfirmOpen(false);
    setIsMaintenanceMode((v) => !v);
    setPendingNextMode(null);
  };

  const confirmCancel = () => {
    setConfirmOpen(false);
    setPendingNextMode(null);
  };

  return (
    <div className="app-shell mnt">
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
              <FontAwesomeIcon icon={faBars} />
            </button>

            <div className="mnt-title">Maintenance</div>
          </div>

          <div className="mnt-topbar-right">
            <button
              className="mnt-icon-btn"
              type="button"
              aria-label="Notifications"
              onClick={() => setActivityOpen(true)}
            >
              <span className="mnt-notif-dot" />
              <FontAwesomeIcon icon={faBell} />
            </button>

            <button
              className="mnt-icon-btn"
              type="button"
              aria-label="Logout"
              title="Logout"
              onClick={() => navigate("/")}
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
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

      {/* Confirm Modal */}
      <MaintenanceConfirmModal
        open={confirmOpen}
        title={
          pendingNextMode === "maintenance"
            ? "Are you sure you want to switch to maintenance?"
            : " Are you sure you want to switch to online?"
        }
        onYes={confirmYes}
        onCancel={confirmCancel}
      />

      {/* Activity Modal (Bell) */}
      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        items={activity}
      />
    </div>
  );
}
