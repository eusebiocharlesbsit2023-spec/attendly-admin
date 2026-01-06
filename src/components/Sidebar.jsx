import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faClipboardList,
  faScrewdriverWrench,
  faUserShield,
  faRightFromBracket,
  faFileLines,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import "./Sidebar.css";

export default function Sidebar({ open, onClose, active = "dashboard" }) {
  const navigate = useNavigate();

  // ✅ get role from login
  const role = localStorage.getItem("role"); // "Admin" | "Super Admin"
  const isSuperAdmin = role === "Super Admin";

  const go = (path) => {
    navigate(path);
    onClose?.(); // close drawer on mobile only
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebarV2 ${open ? "open" : ""}`}>
        {/* Header */}
        <div className="sidebarV2-header">
          <div className="sidebarV2-brand">
            <span className="sidebarV2-title">Attendly</span>
          </div>

          {/* Close button (mobile only via CSS) */}
          <button
            className="sidebarV2-close"
            onClick={onClose}
            type="button"
            aria-label="Close Sidebar"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebarV2-nav">
          <button
            className={`sidebarV2-item ${active === "dashboard" ? "active" : ""}`}
            onClick={() => go("/dashboard")}
            type="button"
          >
            <FontAwesomeIcon icon={faGaugeHigh} className="sidebarV2-icon" />
            <span className="sidebarV2-text">Dashboard</span>
          </button>

          <button
            className={`sidebarV2-item ${active === "attendance" ? "active" : ""}`}
            onClick={() => go("/attendance")}
            type="button"
          >
            <FontAwesomeIcon icon={faClipboardList} className="sidebarV2-icon" />
            <span className="sidebarV2-text">Attendance Record</span>
          </button>

          <button
            className={`sidebarV2-item ${active === "maintenance" ? "active" : ""}`}
            onClick={() => go("/maintenance")}
            type="button"
          >
            <FontAwesomeIcon icon={faScrewdriverWrench} className="sidebarV2-icon" />
            <span className="sidebarV2-text">Maintenance</span>
          </button>

          <button
            className={`sidebarV2-item ${active === "reports" ? "active" : ""}`}
            onClick={() => go("/reports")}
            type="button"
          >
            <FontAwesomeIcon icon={faFileLines} className="sidebarV2-icon" />
            <span className="sidebarV2-text">Reports</span>
          </button>

          {/* ✅ ONLY SUPER ADMIN CAN SEE THIS */}
          {isSuperAdmin && (
            <button
              className={`sidebarV2-item ${active === "manage-admin" ? "active" : ""}`}
              onClick={() => go("/manage-admin")}
              type="button"
            >
              <FontAwesomeIcon icon={faUserShield} className="sidebarV2-icon" />
              <span className="sidebarV2-text">Manage Admin</span>
            </button>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebarV2-footer">
          <button
            className="sidebarV2-logout"
            onClick={logout}
            type="button"
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
