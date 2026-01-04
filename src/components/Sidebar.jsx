import React from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ open, onClose, active = "dashboard" }) {
  const navigate = useNavigate();

  const go = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebarV2 ${open ? "open" : ""}`}>
        <div className="sidebarV2-header">
          <button className="sidebarV2-hamburger" onClick={onClose}>
            ☰
          </button>
          <div className="sidebarV2-title">Menu</div>
        </div>

        <nav className="sidebarV2-nav">
  <button
    className={`sidebarV2-item ${active === "dashboard" ? "active" : ""}`}
    onClick={() => go("/dashboard")}
  >
    <span className="sidebarV2-text">Dashboard</span>
  </button>

  <button
    className={`sidebarV2-item ${active === "attendance" ? "active" : ""}`}
    onClick={() => go("/attendance")}
  >
    <span className="sidebarV2-text">Attendance Record</span>
  </button>

  <button
    className={`sidebarV2-item ${active === "maintenance" ? "active" : ""}`}
    onClick={() => go("/maintenance")}
  >
    <span className="sidebarV2-text">Maintenance</span>
  </button>

  {/* NEW */}
  <button
    className={`sidebarV2-item ${active === "manage-admin" ? "active" : ""}`}
    onClick={() => go("/manage-admin")}
  >
    <span className="sidebarV2-text">Manage Admin</span>
  </button>
</nav>


        


        <div className="sidebarV2-footer">
          <button className="sidebarV2-logout" onClick={() => go("/")}>
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
