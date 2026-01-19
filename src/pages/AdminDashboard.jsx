import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./AdminDashboard.css";
import ActivityHistoryModal from "../components/ActivityHistoryModal";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faUsers,
  faMicrochip,
  faGraduationCap,
  faBookOpen,
  faClock,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";

/* ✅ Notifications store */
import { getNotifications } from "../lib/notifications";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);
  const notifRef = useRef(null);

  const adminProfile = JSON.parse(localStorage.getItem("adminProfile")) || [];

  const stats = [
    { label: "Total Students", value: 45, icon: faUsers, tint: "blue" },
    { label: "Active Devices", value: 43, icon: faMicrochip, tint: "purple" },
    { label: "Professors", value: 6, icon: faGraduationCap, tint: "green" },
    { label: "Active Sessions", value: 1, icon: faBookOpen, tint: "yellow" },
  ];

  const activity = useMemo(
    () => [
      { text: "Kirby Prado marked attendance in CS101", time: "2 minutes ago" },
      { text: "Charles Eusebio marked attendance in CS101", time: "5 minutes ago" },
      { text: "New Student enrolled: Mark Dave Bagaforo", time: "2 hours ago" },
      { text: "Joseph Villa marked attendance in CS101", time: "3 hours ago" },
      { text: "Alfred Valiente marked attendance in CS201", time: "4 hours ago" },
      { text: "Mr. Jayson Joble updated class schedule for CS101", time: "6 hours ago" },
      { text: "Ghim Joseph marked attendance in CS201", time: "3 hours ago" },
      { text: "Professor Jayson Joble created class CS102", time: "Yesterday" },
      { text: "Admin changed Andrei Cruz to Inactive", time: "2 days ago" },
      { text: "Allan Guiraldo marked attendance in CS101", time: "3 days ago" },
      { text: "Professor Michael Tan updated class CS201 syllabus", time: "4 days ago" },
      { text: "Admin changed Andrei Caranto to Active", time: "5 days ago" },

    ],
    []
  );

  const todayClasses = [
    {
      title: "CS101 - Introduction to Computer Science",
      time: "9:00 AM",
      location: "Room 301",
      students: 45,
    },
    {
      title: "CS201 - Information Assurance Security",
      time: "9:00 AM",
      location: "Room 301",
      students: 39,
    },
    {
      title: "PathFit - Sports and Fitness",
      time: "2:00 PM",
      location: "Court",
      students: 30,
    },
    {
      title: "CS102 - Fundamentals of Programming",
      time: "3:30 PM",
      location: "Room 305",
      students: 41,
    },
  ];

  // ✅ Bell dot should reflect unread notifications
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = () => {
    try {
      const notes = getNotifications() || [];
      setUnreadCount(notes.filter((n) => !n.read).length);
    } catch {
      setUnreadCount(0);
    }
  };

  // refresh when dashboard loads
  useEffect(() => {
    refreshUnreadCount();
  }, []);

  return (
    <div className="app-shell dash">
      <Sidebar open={false} active="dashboard" />

      {/* Top Bar */}
      <header className="dash-topbar">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <div>
              <div className="dash-title">Admin Dashboard</div>
              <div className="dash-subtitle">Welcome back, {adminProfile.role}</div>
            </div>
          </div>

          <div className="dash-topbar-right">
            <button
              className="icon-btn bell-btn"
              ref={notifRef}
              onClick={() => {
                setActivityAnchorRect(notifRef.current?.getBoundingClientRect() ?? null);
                setActivityOpen(true);
              }}
            >
              {/* ✅ only show dot if there are unread notifications */}
              {unreadCount > 0 && <span className="notif-dot" />}
              <FontAwesomeIcon icon={faBell} />
            </button>

            {/* logout button removed from topbar */}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="dash-main">
        {/* STATS */}
        <section className="stats-grid">
          {stats.map((s) => (
            <div className="card stat-card" key={s.label}>
              <div className={`stat-icon tint-${s.tint}`}>
                <FontAwesomeIcon icon={s.icon} />
              </div>
              <div className="stat-right">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </section>

        {/* MANAGE */}
        <section className="manage-grid">
          <ManageCard
            title="Manage Students"
            icon={faUsers}
            onClick={() => navigate("/students")}
            tint="blue"
          />
          <ManageCard
            title="Manage Classes"
            icon={faBookOpen}
            onClick={() => navigate("/classes")}
            tint="yellow"
          />
          <ManageCard
            title="Manage Professors"
            icon={faGraduationCap}
            onClick={() => navigate("/professors")}
            tint="green"
          />
        </section>

        {/* BOTTOM */}
        <section className="bottom-grid">
          {/* Activity */}
          <div className="card panel">
            <div className="panel-title">
              <FontAwesomeIcon icon={faClock} />
              <span>Recent Activity</span>
            </div>

            <div className="activity-list">
              {/* ✅ show more items so it becomes scrollable */}
              {activity.slice(0, 6).map((a, i) => (
                <div className="activity-item" key={i}>
                  <span className="activity-bullet" />
                  <div>
                    <div className="activity-main">{a.text}</div>
                    <div className="activity-sub">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classes */}
          <div className="card panel">
            <div className="panel-title plain">Today Classes</div>

            <div className="classes-list">
              {todayClasses.map((c) => (
                <div className="class-item" key={c.title}>
                  <div>
                    <div className="class-title">{c.title}</div>
                    <div className="class-meta">
                      <span>
                        <FontAwesomeIcon icon={faClock} /> {c.time}
                      </span>
                      <span>
                        <FontAwesomeIcon icon={faLocationDot} /> {c.location}
                      </span>
                    </div>
                  </div>
                  <div className="badge">{c.students} Students</div>
                </div>
              ))}
            </div>

            <div className="panel-footer">
              <button
                className="link-btn"
                type="button"
                onClick={() => navigate("/schedule")}
              >
                View Schedule
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ✅ CONNECTED: passing items seeds/merges into the store in your updated modal */}
      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => {
          setActivityOpen(false);
          // refresh dot after read/unread/delete actions
          refreshUnreadCount();
        }}
        items={activity}
        anchorRect={activityAnchorRect}
      />
    </div>
  );
}

/* ===== MANAGE CARD ===== */
function ManageCard({ title, icon, onClick, tint }) {
  return (
    <div className="card manage-card">
      <button className="manage-btn" onClick={onClick}>
        <div className={`manage-icon tint-${tint}`}>
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="manage-text">{title}</div>
      </button>
    </div>
  );
}
