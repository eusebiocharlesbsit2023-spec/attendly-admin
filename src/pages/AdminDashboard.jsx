import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./AdminDashboard.css";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import supabase from "../helper/supabaseClient";

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

  const [stats, setStats] = useState([
    { label: "Total Students", value: "—", icon: faUsers, tint: "blue" },
    { label: "Active Devices", value: "N/A", icon: faMicrochip, tint: "purple" },
    { label: "Professors", value: "—", icon: faGraduationCap, tint: "green" },
    { label: "Active Sessions", value: "—", icon: faBookOpen, tint: "yellow" },
  ]);

  const fetchStats = async () => {
    try {
      const [studentsRes, profsRes, sessionsRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("archived", false),
        supabase.from("professors").select("id", { count: "exact", head: true }).eq("archived", false),

        // ✅ optional: active sessions
        supabase.from("class_sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
        // alt if wala kang status: .is("ended_at", null)
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (profsRes.error) throw profsRes.error;
      if (sessionsRes.error) throw sessionsRes.error;

      setStats([
        { label: "Total Students", value: studentsRes.count ?? 0, icon: faUsers, tint: "blue" },
        { label: "Active Devices", value: "0", icon: faMicrochip, tint: "purple" },
        { label: "Professors", value: profsRes.count ?? 0, icon: faGraduationCap, tint: "green" },
        { label: "Active Sessions", value: sessionsRes.count ?? 0, icon: faBookOpen, tint: "yellow" },
      ]);
    } catch (e) {
      console.log("fetchStats error:", e?.message || e);
    }
  };

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

  const [todayClasses, setTodayClasses] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayErr, setTodayErr] = useState(null);

  const fetchTodayClasses = async () => {
    setTodayLoading(true);
    setTodayErr(null);

    try {
      const day = todayName();

      const { data, error } = await supabase
        .from("classes")
        .select(`
          id,
          course,
          course_code,
          room,
          day_of_week,
          start_time,
          end_time,
          archived,
          class_enrollments(count)
        `)
        .eq("archived", false)
        .eq("day_of_week", day)
        .order("start_time", { ascending: true });

      if (error) throw error;

      const mapped = (data ?? []).map((c) => ({
        id: c.id,
        title: `${c.course} (${c.course_code})`,
        time: formatTimeFromDB(c.start_time),
        location: c.room ? `Room ${c.room}` : "—",
        students: Number(c.class_enrollments?.[0]?.count ?? 0), // ✅ enrolled count
      }));
      setTodayClasses(mapped);
    } catch (e) {
      setTodayErr(e.message || String(e));
      setTodayClasses([]);
    } finally {
      setTodayLoading(false);
    }
  };

  function todayName() {
    // JS: 0=Sun..6=Sat
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return names[new Date().getDay()];
  }

  function formatTimeFromDB(t) {
    if (!t) return "—";
    const [hh, mm] = String(t).split(":");
    let h = Number(hh);
    const m = String(mm ?? "00").padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

// load on mount
useEffect(() => {
  fetchTodayClasses();
  fetchStats();
}, []);

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
      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <div>
              <div className="dash-title">Admin Dashboard</div>
              <div className="dash-subtitle">Welcome back, {adminProfile.role}</div>
            </div>
          </div>

          <div className="mnt-topbar-right">
            <button
              className="mnt-icon-btn"
              ref={notifRef}
              onClick={() => {
                setActivityAnchorRect(notifRef.current?.getBoundingClientRect() ?? null);
                setActivityOpen(true);
              }}
            >
              {/* ✅ only show dot if there are unread notifications */}
              {unreadCount > 0 && <span className="mnt-notif-dot" />}
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
            {todayLoading ? (
              <div className="activity-sub">Loading today classes...</div>
            ) : todayErr ? (
              <div className="activity-sub">Error: {todayErr}</div>
            ) : todayClasses.length === 0 ? (
              <div className="activity-sub">No classes scheduled today.</div>
            ) : (
              todayClasses.map((c) => (
                <div className="class-item" key={c.id}>
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

                  {/* optional button */}
                  <div className="badge">{c.students} Students</div>
                </div>
              ))
            )}
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