import React, { useState } from "react";
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
import ConfirmModal from "./ConfirmModal";
import supabase from "../helper/supabaseClient";

export default function Sidebar({ open, onClose, active = "dashboard" }) {
  const navigate = useNavigate();

  // ✅ get role from login
  const adminProfile = JSON.parse(localStorage.getItem("adminProfile")); // "Admin" | "Super Admin"
  const isSuperAdmin = adminProfile.role === "Super Admin";

  const [confirmOpen, setConfirmOpen] = useState(false);

  const go = (path) => {
    navigate(path);
    onClose?.(); // close drawer on mobile only
  };

  const logout = () => {
    setConfirmOpen(true);
  };

  const performLogout = async () => {
    const {error} = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/");
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className='sidebarV2 navbar'>
        {/* Header */}
        <div className="sidebarV2-header">
          <div className="sidebarV2-brand">
            <img src={Logo} alt="" />
          </div>
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

          <button
            className={`sidebarV2-item ${active === "maintenance" ? "active" : ""}`}
            onClick={() => go("/maintenance")}
            type="button"
          >
            <FontAwesomeIcon icon={faScrewdriverWrench} className="sidebarV2-icon" />
            <span className="sidebarV2-text">Maintenance</span>
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
          <button className="logout-btn" onClick={logout}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            Log out
          </button>
        </div>
      </aside>
      <ConfirmModal
        open={confirmOpen}
        title={"Are you sure you want to log out?"}
        onYes={performLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}