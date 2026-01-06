import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./AdminDashboard.css";
import ActivityHistoryModal from "../components/ActivityHistoryModal";

/* Figma-style icons */
import { Users, Cpu, GraduationCap, BookOpen } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);
  const notifRef = useRef(null);

  const stats = [
    { label: "Total Students", value: 45, tint: "blue" },
    { label: "Active Devices", value: 40, tint: "purple" },
    { label: "Professors", value: 6, tint: "green" },
    { label: "Active Sessions", value: 1, tint: "yellow" },
  ];

  const activity = [
    { text: "John Smith marked attendance in CS101", time: "2 minutes ago" },
    { text: "Haylee Steinfield marked attendance in CS101", time: "5 minutes ago" },
    { text: "New Student enrolled: Emma Wilson", time: "2 hours ago" },
    { text: "Dakota Johnson marked attendance in CS201", time: "3 hours ago" },
    { text: "Professor Sadie Mayers created class CS102", time: "Yesterday" },
    { text: "Admin changed Alice Willson to Inactive", time: "2 days ago" },
  ];

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
  ];

  /* Stat icons */
  const StatIcon = ({ label }) => {
    const common = { size: 26, strokeWidth: 2.2 };
    if (label === "Total Students") return <Users {...common} />;
    if (label === "Active Devices") return <Cpu {...common} />;
    if (label === "Professors") return <GraduationCap {...common} />;
    if (label === "Active Sessions") return <BookOpen {...common} />;
    return null;
  };

  return (
    <div className="app-shell dash">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="dashboard" />

      {/* Top Bar */}
      <header className="dash-topbar">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <div>
              <div className="dash-title">Admin Dashboard</div>
              <div className="dash-subtitle">Welcome back, Admin</div>
            </div>
          </div>

          <div className="dash-topbar-right">
            <button
              className="icon-btn bell-btn"
              ref={notifRef}
              onClick={() => {
                // capture the bell button position and open the modal anchored to it
                setActivityAnchorRect(notifRef.current?.getBoundingClientRect() ?? null);
                setActivityOpen(true);
              }}
            >
              <span className="notif-dot" />
              <Svg name="bell" />
            </button> 
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
                <StatIcon label={s.label} />
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
            icon="students"
            tint="blue"
            onClick={() => navigate("/students")}
          />
          <ManageCard
            title="Manage Classes"
            icon="classes"
            tint="yellow"
            onClick={() => navigate("/classes")}
          />
          <ManageCard
            title="Manage Professors"
            icon="professors"
            tint="green"
            onClick={() => navigate("/professors")}
          />
        </section>

        {/* BOTTOM */}
        <section className="bottom-grid">
          {/* Recent Activity */}
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
          </div>

          {/* Today Classes */}
          <div className="card panel">
            <div className="panel-title plain">Today Classes</div>

            <div className="classes-list">
              {todayClasses.map((c) => (
                <div className="class-item" key={c.title}>
                  <div>
                    <div className="class-title">{c.title}</div>
                    <div className="class-meta">
                      <span>
                        <Svg name="clock" small /> {c.time}
                      </span>
                      <span>
                        <Svg name="pin" small /> {c.location}
                      </span>
                    </div>
                  </div>
                  <div className="badge">{c.students} Students</div>
                </div>
              ))}
            </div>

            {/* VIEW SCHEDULE */}
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

      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        items={activity}
        anchorRect={activityAnchorRect}
      />
    </div>
  );
}

/* ===== MANAGE CARD ===== */
function ManageCard({ title, icon, onClick, tint }) {
  const common = { size: 28, strokeWidth: 2.2 };
  const icons = {
    students: <Users {...common} />,
    classes: <BookOpen {...common} />,
    professors: <GraduationCap {...common} />,
  };

  return (
    <div className="card manage-card">
      <button className="manage-btn" onClick={onClick}>
        <div className={`manage-icon tint-${tint}`}>{icons[icon]}</div>
        <div className="manage-text">{title}</div>
      </button>
    </div>
  );
}

/* ===== SVG HELPER ===== */
function Svg({ name, small = false }) {
  const s = small ? 16 : 22;
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none" };

  const icons = {
    bell: (
      <>
        <path
          d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M10 19a2 2 0 004 0"
          stroke="currentColor"
          strokeWidth="2"
        />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    pin: (
      <path
        d="M12 21s7-4.5 7-11a7 7 0 10-14 0z"
        stroke="currentColor"
        strokeWidth="2"
      />
    ),
  };

  return <svg {...props}>{icons[name]}</svg>;
}
