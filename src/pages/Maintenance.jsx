import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import MaintenanceConfirmModal from "../components/MaintenanceConfirmModal";

/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

/* ===== Supabase Client ===== */ 
import supabase from "../helper/supabaseClient";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

import "./Maintenance.css";

export default function Maintenance() {
  /* ✅ USE THE REUSABLE HOOK */
  const {
    realActivity,
    unreadCount,
    activityOpen,
    setActivityOpen,
    activityAnchorRect,
    notifRef,
    openNotif,
    refreshUnreadCount,
  } = useNotifications();

  // Local States
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingNextMode, setPendingNextMode] = useState(null);

  // 1. Fetch current status on load
  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("is_active")
        .eq("id", "maintenance_mode")
        .single();

      if (error) throw error;
      if (data) setIsMaintenanceMode(data.is_active);
    } catch (err) {
      console.error("Error fetching maintenance status:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = isMaintenanceMode ? "Maintenance" : "Online";
  const statusClass = isMaintenanceMode ? "status-red" : "status-green";

  const handleSwitch = () => {
    const next = isMaintenanceMode ? "online" : "maintenance";
    setPendingNextMode(next);
    setConfirmOpen(true);
  };

  // 2. Functional update to Supabase
  const confirmYes = async () => {
    const nextValue = pendingNextMode === "maintenance";
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from("system_settings")
        .update({ 
          is_active: nextValue,
          updated_at: new Date().toISOString() 
        })
        .eq("id", "maintenance_mode");

      if (error) throw error;

      setIsMaintenanceMode(nextValue);
      setConfirmOpen(false);
      setPendingNextMode(null);
    } catch (err) {
      console.error("Update failed:", err.message);
      alert("Failed to update system status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmCancel = () => {
    setConfirmOpen(false);
    setPendingNextMode(null);
  };

  return (
    <div className="app-shell mnt">
      <Sidebar open={false} active="maintenance" />

      {/* Top Bar */}
      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <div className="mnt-title">Maintenance</div>
          </div>

          <div className="mnt-topbar-right">
            {/* ✅ REUSABLE BELL ICON LOGIC */}
            <button
              className="mnt-icon-btn"
              type="button"
              aria-label="Notifications"
              ref={notifRef}
              onClick={openNotif}
            >
              {unreadCount > 0 && <span className="mnt-notif-dot" />}
              <FontAwesomeIcon icon={faBell} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mnt-main">
        <section className="mnt-card">
          <h2 className="mnt-card-title">System Current Status</h2>

          {loading ? (
            <div className="mnt-status-row">
              <span className="mnt-status-text">Checking system status...</span>
            </div>
          ) : (
            <div className="mnt-status-row">
              <span className={`mnt-dot ${statusClass}`} />
              <span className="mnt-status-text">{statusLabel}</span>
            </div>
          )}

          <p className="mnt-desc">
            The Attendly system is currently undergoing scheduled maintenance to ensure stability,
            security, and proper operation. During this time, attendance recording and related
            services are temporarily unavailable. Users are advised to wait until the maintenance
            process is completed before accessing the application. Normal system operations will
            resume once maintenance has finished.
          </p>

          <button 
            className="mnt-btn" 
            type="button" 
            onClick={handleSwitch}
            disabled={loading}
          >
            {loading ? "Processing..." : isMaintenanceMode ? "Switch to Online" : "Switch to Maintenance"}
          </button>
        </section>
      </main>

      {/* Confirm Modal */}
      <MaintenanceConfirmModal
        open={confirmOpen}
        title={
          pendingNextMode === "maintenance"
            ? "Are you sure you want to switch to maintenance?"
            : "Are you sure you want to switch to online?"
        }
        onYes={confirmYes}
        onCancel={confirmCancel}
      />

      {/* ✅ REUSABLE MODAL WITH REALTIME DATA */}
      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => {
          setActivityOpen(false);
          refreshUnreadCount();
        }}
        items={realActivity}
        anchorRect={activityAnchorRect}
      />
    </div>
  );
}