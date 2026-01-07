import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faHistory,
  faScrewdriverWrench,
  faUserShield,
  faRightFromBracket,
  faFileLines,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import "./Sidebar.css";
import Logo from '../assets/Logo.png';

// ✅ import logo (OPTION 1 – recommended)
import logo from "../assets/logo.png"; 
// make sure logo is here: src/assets/logo.png
// OR use /logo.png if stored in public folder

export default function Sidebar({ open, onClose, active = "dashboard" }) {
  const navigate = useNavigate();

  const role = localStorage.getItem("role"); // "Admin" | "Super Admin"
  const isSuperAdmin = role === "Super Admin";

  const go = (path) => {
    navigate(path);
    onClose?.();
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
            <img
              src={logo}
              alt="Attendly Logo"
              className="sidebarV2-logo"
            />
            <span className="sidebarV2-title"></span>
          </div>

          {/* Close button (mobile only) */}
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
            <FontAwesomeIcon icon={faHouse} className="sidebarV2-icon" />
            <span className="sidebarV2-text">Dashboard</span>
          </button> 

          <button
            className={`sidebarV2-item ${active === "attendance" ? "active" : ""}`}
            onClick={() => go("/attendance")}
            type="button"
          >
            <FontAwesomeIcon icon={faHistory} className="sidebarV2-icon" />
            <span className="sidebarV2-text">Attendance Record</span>
          </button>

          <button
            className={`sidebarV2-item ${active === "reports" ? "active" : ""}`}
            onClick={() => go("/reports")}
            type="button"
          >
            <FontAwesomeIcon icon={faFileLines} className="sidebarV2-icon" />
            <span className="sidebarV2-text">Reports</span>
          </button>

          {/* Super Admin only */}
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
          <button className="logout-btn" onClick={logout}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
