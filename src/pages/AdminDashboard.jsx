import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./AdminDashboard.css";
import ActivityHistoryModal from "../components/ActivityHistoryModal";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const stats = [
    { label: "Total Students", value: 45, icon: "users", tint: "blue" },
    { label: "Active Devices", value: 40, icon: "chip", tint: "purple" },
    { label: "Professors", value: 6, icon: "cap", tint: "green" },
    { label: "Active Sessions", value: 1, icon: "book", tint: "yellow" },
  ];

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

  const todayClasses = [
    { title: "CS101 - Introduction to Computer Science", time: "9:00 AM", location: "Room 301", students: 45 },
    { title: "CS201 - Information Assurance Security", time: "9:00 AM", location: "Room 301", students: 39 },
    { title: "PathFit - Sports and Fitness", time: "2:00 PM", location: "Court", students: 30 },
  ];

  return (
    <div className="app-shell dash">
      {/* Sidebar */}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="dashboard" />

      {/* Top Bar */}
      <header className="dash-topbar">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <button className="icon-btn" onClick={() => setMenuOpen(true)}>
              <Svg name="menu" />
            </button>

            <div>
              <div className="dash-title">Admin Dashboard</div>
              <div className="dash-subtitle">Welcome back, Admin123!</div>
            </div>
          </div>

          <div className="dash-topbar-right">
            <button className="icon-btn" onClick={() => setActivityOpen(true)}>
              <span className="notif-dot" />
              <Svg name="bell" />
            </button>

            <button className="icon-btn" onClick={() => navigate("/")}>
              <Svg name="logout" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dash-main">
        {/* Stats */}
        <section className="stats-grid">
          {stats.map((s) => (
            <div className="card stat-card" key={s.label}>
              <div className={`stat-icon tint-${s.tint}`}>
                <Svg name={s.icon} />
              </div>
              <div className="stat-right">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Manage */}
        <section className="manage-grid">
          <ManageCard title="Manage Students" icon="users" onClick={() => navigate("/students")} tint="blue" />
          <ManageCard title="Manage Classes" icon="book" onClick={() => navigate("/classes")} tint="yellow" />
          <ManageCard title="Manage Professors" icon="cap" onClick={() => navigate("/professors")} tint="green" />
        </section>

        {/* Bottom */}
        <section className="bottom-grid">
          <div className="card panel">
            <div className="panel-title">
              <Svg name="clock" small />
              <span>Recent Activity</span>
            </div>

            <div className="activity-list">
              {activity.slice(0, 3).map((a, i) => (
                <div className="activity-item" key={i}>
                  <span className="activity-bullet" />
                  <div>
                    <div className="activity-main">{a.text}</div>
                    <div className="activity-sub">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel-footer hint">
              Click the bell icon to view full activity history
            </div>
          </div>

          <div className="card panel">
            <div className="panel-title plain">Today Classes</div>

            <div className="classes-list">
              {todayClasses.map((c) => (
                <div className="class-item" key={c.title}>
                  <div>
                    <div className="class-title">{c.title}</div>
                    <div className="class-meta">
                      <span><Svg name="clock" small />{c.time}</span>
                      <span><Svg name="pin" small />{c.location}</span>
                    </div>
                  </div>
                  <div className="badge">{c.students} Students</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Activity Modal */}
      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        items={activity}
      />
    </div>
  );
}

/* ===== Helpers ===== */

function ManageCard({ title, icon, onClick, tint }) {
  return (
    <div className="card manage-card">
      <button className="manage-btn" onClick={onClick}>
        <div className={`manage-icon tint-${tint}`}>
          <Svg name={icon} />
        </div>
        <div className="manage-text">{title}</div>
      </button>
    </div>
  );
}

function Svg({ name, small = false }) {
  const s = small ? 16 : 22;
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none" };

  const icons = {
    menu: <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" stroke="currentColor" strokeWidth="2" />
        <path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    logout: (
      <>
        <path d="M10 16l-4-4 4-4" stroke="currentColor" strokeWidth="2" />
        <path d="M6 12h9" stroke="currentColor" strokeWidth="2" />
        <path d="M14 7a4 4 0 014 4v2a4 4 0 01-4 4" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    users: <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />,
    chip: <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />,
    cap: <path d="M12 3l10 5-10 5L2 8z" stroke="currentColor" strokeWidth="2" />,
    book: <path d="M6 3h14v16H6z" stroke="currentColor" strokeWidth="2" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    pin: <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0z" stroke="currentColor" strokeWidth="2" />,
  };

  return <svg {...props}>{icons[name]}</svg>;
}
