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
  ];

  const todayClasses = [
    { title: "CS101 - Introduction to Computer Science", time: "9:00 AM", location: "Room 301", students: 45 },
    { title: "CS201 - Information Assurance Security", time: "9:00 AM", location: "Room 301", students: 39 },
    { title: "PathFit - Sports and Fitness", time: "2:00 AM", location: "Court", students: 30 },
  ];

  return (
    <div className="dash">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="dashboard" />

      {/* Top Bar */}
      <header className="dash-topbar">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <button className="icon-btn" aria-label="Menu" type="button" onClick={() => setMenuOpen(true)}>
              <Svg name="menu" />
            </button>

            <div>
              <div className="dash-title">Admin Dashboard</div>
              <div className="dash-subtitle">Welcome back, Admin123!</div>
            </div>
          </div>

          <div className="dash-topbar-right">
            <button className="icon-btn" aria-label="Notifications" type="button">
              <span className="notif-dot" />
              <Svg name="bell" />
            </button>

            <button className="icon-btn" aria-label="Logout" type="button" onClick={() => navigate("/")} title="Logout">
              <Svg name="logout" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="dash-main">
        <section className="stats-grid">
          {stats.map((s) => (
            <div className="card stat-card" key={s.label}>
              <div className={`stat-icon tint-${s.tint}`}>
                <Svg name={s.icon} />
              </div>
              <div className="stat-right">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label" title={s.label}>{s.label}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="manage-grid">
          <div className="card manage-card">
  <button
    className="manage-btn"
    type="button"
    onClick={() => navigate("/students")}
  >
    <div className="manage-icon tint-blue">
      <Svg name="users" />
    </div>
    <div className="manage-text">Manage Students</div>
  </button>
</div>


          <div className="card manage-card">
  <button
    className="manage-btn"
    type="button"
    onClick={() => navigate("/classes")}
  >
    <div className="manage-icon tint-yellow">
      <Svg name="book" />
    </div>
    <div className="manage-text">Manage Classes</div>
  </button>
</div>


          <div className="card manage-card">
  <button
    className="manage-btn"
    type="button"
    onClick={() => navigate("/professors")}
  >
    <div className="manage-icon tint-green">
      <Svg name="cap" />
    </div>
    <div className="manage-text">Manage Professors</div>
  </button>
</div>

        </section>

        <section className="bottom-grid">
          <div className="card panel">
            <div className="panel-title">
              <Svg name="clock" small />
              <span>Recent Activity</span>
            </div>

            <div className="activity-list">
              {activity.map((a, idx) => (
                <div className="activity-item" key={idx}>
                  <span className="activity-bullet" />
                  <div className="activity-text">
                    <div className="activity-main">{a.text}</div>
                    <div className="activity-sub">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel-footer">
              <button className="link-btn" type="button" onClick={() => setActivityOpen(true)}>
  View All Activity
</button>

            </div>
          </div>

          <div className="card panel">
            <div className="panel-title plain">
              <span>Today Classes</span>
            </div>

            <div className="classes-list">
              {todayClasses.map((c) => (
                <div className="class-item" key={c.title}>
                  <div className="class-left">
                    <div className="class-title">{c.title}</div>
                    <div className="class-meta">
                      <span className="meta-pill"><Svg name="clock" small />{c.time}</span>
                      <span className="meta-pill"><Svg name="pin" small />{c.location}</span>
                    </div>
                  </div>
                  <div className="badge">{c.students} Students</div>
                </div>
              ))}
            </div>

            <div className="panel-footer">
              <button className="link-btn" type="button">View Schedule</button>
            </div>
          </div>
        </section>
      </main>
      <ActivityHistoryModal
  open={activityOpen}
  onClose={() => setActivityOpen(false)}
  items={activity}
/>

    </div>
  );
}

/* Dashboard icons only */
function Svg({ name, small = false }) {
  const s = small ? 16 : 22;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: small ? "svg small" : "svg",
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
          <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
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
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 21v-2a3 3 0 00-2-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "chip":
      return (
        <svg {...common}>
          <path d="M9 9h6v6H9V9z" stroke="currentColor" strokeWidth="2" />
          <path d="M4 9h2M4 15h2M18 9h2M18 15h2M9 4v2M15 4v2M9 18v2M15 18v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "cap":
      return (
        <svg {...common}>
          <path d="M12 3l10 5-10 5L2 8l10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M6 10v6c0 1 3 3 6 3s6-2 6-3v-6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19a2 2 0 012-2h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 3h14v16H6a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
}
