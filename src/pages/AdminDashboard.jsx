import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./AdminDashboard.css";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import supabase from "../helper/supabaseClient";

/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const adminProfile = JSON.parse(localStorage.getItem("adminProfile")) || [];

  /* ✅ USE THE REUSABLE HOOK */
  const {
    realActivity,
    activityLoading,
    unreadCount,
    activityOpen,
    setActivityOpen,
    activityAnchorRect,
    notifRef,
    openNotif,
    refreshUnreadCount,
  } = useNotifications();

  // --- Dashboard Local States ---
  const [todayClasses, setTodayClasses] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayErr, setTodayErr] = useState(null);
  const [stats, setStats] = useState([
    { label: "Total Students", value: "—", icon: faUsers, tint: "blue" },
    { label: "Professors", value: "—", icon: faGraduationCap, tint: "green" },
    { label: "Active Sessions", value: "—", icon: faBookOpen, tint: "yellow" },
  ]);
  const isOnlineInClassroom = (device) => {
    const location = String(device?.current_location || "").toUpperCase();
    if (location !== "CLASSROOM") return false;

    if (typeof device?.is_online === "boolean") return device.is_online;

    const statusCandidates = [
      device?.status,
      device?.current_status,
      device?.device_status,
      device?.connection_status,
    ];

    const normalized = statusCandidates
      .map((v) => String(v || "").toLowerCase().trim())
      .find(Boolean);

    if (normalized) return normalized === "online";

    return false;
  };

  // 1. Fetch Stats
  const fetchStats = async () => {
    try {
      const [studentsRes, profsRes, sessionsRes] = await Promise.all([
        supabase.from("devices").select("*").eq("current_location", "CLASSROOM"),
        supabase.from("professors").select("id", { count: "exact", head: true }).eq("archived", false),
        supabase.from("class_sessions").select("id", { count: "exact", head: true }).eq("status", "started"),
      ]);

      const totalOnlineInClassroom = (studentsRes.data ?? []).filter(isOnlineInClassroom).length;

      setStats([
        { label: "Total Students", value: totalOnlineInClassroom, icon: faUsers, tint: "blue" },
        { label: "Professors", value: profsRes.count ?? 0, icon: faGraduationCap, tint: "green" },
        { label: "Active Sessions", value: sessionsRes.count ?? 0, icon: faBookOpen, tint: "yellow" },
      ]);
    } catch (e) {
      console.log("fetchStats error:", e?.message || e);
    }
  };

  // 2. Fetch Today Classes
  const fetchTodayClasses = async () => {
    setTodayLoading(true);
    setTodayErr(null);
    try {
      const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const day = names[new Date().getDay()];

      const { data, error } = await supabase
        .from("classes")
        .select(`id, course, course_code, room, start_time, class_enrollments(count)`)
        .eq("archived", false)
        .eq("day_of_week", day)
        .order("start_time", { ascending: true });

      if (error) throw error;

      setTodayClasses((data ?? []).map((c) => ({
        id: c.id,
        title: `${c.course} (${c.course_code})`,
        time: formatTimeFromDB(c.start_time),
        location: c.room ? `Room ${c.room}` : "—",
        students: Number(c.class_enrollments?.[0]?.count ?? 0),
      })));
    } catch (e) {
      setTodayErr(e.message || String(e));
    } finally {
      setTodayLoading(false);
    }
  };

  function formatTimeFromDB(t) {
    if (!t) return "—";
    const [hh, mm] = String(t).split(":");
    let h = Number(hh);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${mm} ${ampm}`;
  }

  useEffect(() => {
    fetchTodayClasses();
    fetchStats();
  }, []);

  return (
    <div className="app-shell dash">
      <Sidebar open={false} active="dashboard" />

      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <div>
              <div className="dash-title">Admin Dashboard</div>
              <div className="dash-subtitle">Welcome back, {adminProfile.role}</div>
            </div>
          </div>
          <div className="mnt-topbar-right">
            {/* ✅ REUSABLE BELL ICON LOGIC */}
            <button className="mnt-icon-btn" ref={notifRef} onClick={openNotif}>
              {unreadCount > 0 && <span className="mnt-notif-dot" />}
              <FontAwesomeIcon icon={faBell} />
            </button>
          </div>
        </div>
      </header>

      <main className="dash-main">
        {/* STATS */}
        <section className="stats-grid">
          {stats.map((s) => (
            <div className="card stat-card" key={s.label}>
              <div className={`stat-icon tint-${s.tint}`}><FontAwesomeIcon icon={s.icon} /></div>
              <div className="stat-right">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </section>

        {/* MANAGE */}
        <section className="manage-grid">
          <ManageCard title="Manage Students" icon={faUsers} onClick={() => navigate("/students")} tint="blue" />
          <ManageCard title="Manage Classes" icon={faBookOpen} onClick={() => navigate("/classes")} tint="yellow" />
          <ManageCard title="Manage Professors" icon={faGraduationCap} onClick={() => navigate("/professors")} tint="green" />
          <ManageCard title="Manage Subjects" icon={faBookOpen} onClick={() => navigate("/subjects")} tint="blue" />
        </section>

        {/* BOTTOM */}
        <section className="bottom-grid">
          {/* Recent Activity Panel */}
          <div className="card panel">
            <div className="panel-title">
              <FontAwesomeIcon icon={faClock} />
              <span>Recent Activity</span>
            </div>
            <div className="activity-list">
              {activityLoading ? (
                <div className="activity-sub">Loading activity...</div>
              ) : realActivity.length === 0 ? (
                <div className="activity-sub">No recent activity.</div>
              ) : (
                realActivity.slice(0, 6).map((a, i) => (
                  <div className="activity-item" key={a.id || i}>
                    <span className="activity-bullet" />
                    <div>
                      <div className="activity-main">{a.text}</div>
                      <div className="activity-sub">{a.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Today Classes */}
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
                        <span><FontAwesomeIcon icon={faClock} /> {c.time}</span>
                        <span><FontAwesomeIcon icon={faLocationDot} /> {c.location}</span>
                      </div>
                    </div>
                    <div className="badge">{c.students} Students</div>
                  </div>
                ))
              )}
            </div>
            <div className="panel-footer">
              <button className="link-btn" type="button" onClick={() => navigate("/schedule")}>
                View Schedule
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ✅ REUSABLE MODAL */}
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

function ManageCard({ title, icon, onClick, tint }) {
  return (
    <div className="card manage-card">
      <button className="manage-btn" onClick={onClick}>
        <div className={`manage-icon tint-${tint}`}><FontAwesomeIcon icon={icon} /></div>
        <div className="manage-text">{title}</div>
      </button>
    </div>
  );
}
