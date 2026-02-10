import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faHistory,
  faScrewdriverWrench,
  faUserShield,
  faRightFromBracket,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import "./Sidebar.css";
import Logo from "../assets/Logo.png";
import ConfirmModal from "./ConfirmModal";
import supabase from "../helper/supabaseClient";

export default function Sidebar({ open, onClose, active = "dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const adminProfile = JSON.parse(localStorage.getItem("adminProfile") || "{}");
  const isSuperAdmin = adminProfile?.role === "Super Admin";

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const go = (path) => {
    navigate(path);
    onClose?.();
  };

  const logout = () => setConfirmOpen(true);

  const performLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      localStorage.clear();
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      setLoggingOut(false);
    }
  };

  const pathname = location.pathname || "";
  const reportsOpen = active === "reports";

  // highlight sub tab based on URL even if same component
  const reportsSubActive = pathname.includes("/reports/class-archive")
    ? "class-archive"
    : pathname.includes("/reports/archive")
    ? "archive"
    : "feedback";

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className="sidebarV2 navbar">
        <div className="sidebarV2-header">
          <div className="sidebarV2-brand">
            <img src={Logo} alt="" />
          </div>
        </div>

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

          {/* Reports + sub buttons */}
          <div className="sidebarV2-group">
            <button
              className={`sidebarV2-item ${active === "reports" ? "active" : ""}`}
              onClick={() => go("/reports/feedback")} // ✅ default
              type="button"
            >
              <FontAwesomeIcon icon={faFileLines} className="sidebarV2-icon" />
              <span className="sidebarV2-text">Reports</span>
            </button>

            {reportsOpen && (
              <div className="sidebarV2-subnav">
                <button
                  className={`sidebarV2-subitem ${
                    reportsSubActive === "feedback" ? "active" : ""
                  }`}
                  onClick={() => go("/reports/feedback")}
                  type="button"
                >
                  Feedback
                </button>

                <button
                  className={`sidebarV2-subitem ${
                    reportsSubActive === "archive" ? "active" : ""
                  }`}
                  onClick={() => go("/reports/archive")}
                  type="button"
                >
                  User Archive
                </button>

                <button
                  className={`sidebarV2-subitem ${
                    reportsSubActive === "class-archive" ? "active" : ""
                  }`}
                  onClick={() => go("/reports/class-archive")}
                  type="button"
                >
                  Class Archive
                </button>
              </div>
            )}
          </div>

          <button
            className={`sidebarV2-item ${active === "maintenance" ? "active" : ""}`}
            onClick={() => go("/maintenance")}
            type="button"
          >
            <FontAwesomeIcon icon={faScrewdriverWrench} className="sidebarV2-icon" />
            <span className="sidebarV2-text">Maintenance</span>
          </button>

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

        <div className="sidebarV2-footer">
          <button className="logout-btn" onClick={logout} disabled={loggingOut}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </aside>

      <ConfirmModal
        open={confirmOpen}
        title={"Are you sure you want to log out?"}
        onYes={performLogout}
        onCancel={() => setConfirmOpen(false)}
      />

      {loggingOut && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "18px 22px",
              borderRadius: 12,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              textAlign: "center",
              minWidth: 220,
            }}
          >
            <div style={{ fontWeight: 700 }}>Logging out</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Please wait...</div>
          </div>
        </div>
      )}
    </>
  );
}
