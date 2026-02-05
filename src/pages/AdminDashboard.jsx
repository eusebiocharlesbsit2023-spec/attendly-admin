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

  // --- States ---
  const [realActivity, setRealActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayErr, setTodayErr] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [stats, setStats] = useState([
    { label: "Total Students", value: "—", icon: faUsers, tint: "blue" },
    { label: "Active Devices", value: "N/A", icon: faMicrochip, tint: "purple" },
    { label: "Professors", value: "—", icon: faGraduationCap, tint: "green" },
    { label: "Active Sessions", value: "—", icon: faBookOpen, tint: "yellow" },
  ]);

  // 1. Fetch Stats
  const fetchStats = async () => {
    try {
      const [studentsRes, profsRes, sessionsRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("archived", false),
        supabase.from("professors").select("id", { count: "exact", head: true }).eq("archived", false),
        supabase.from("class_sessions").select("id", { count: "exact", head: true }).eq("status", "started"),
      ]);

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

  // 2. Fetch Real Activity (3rd Person Messages from DB)
  const fetchActivities = async () => {
    setActivityLoading(true);
    try {
      const { data, error } = await supabase
        .from("recent_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setRealActivity((data || []).map(act => ({
        id: act.id,
        text: act.message,
        time: formatTimeAgo(act.created_at),
      })));
    } catch (e) {
      console.error("fetchActivities error:", e);
    } finally {
      setActivityLoading(false);
    }
  };

  // 3. Fetch Today Classes (Fixed UI Data)
  const fetchTodayClasses = async () => {
    setTodayLoading(true);
    setTodayErr(null);
    try {
      const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const day = names[new Date().getDay()];

      const { data, error } = await supabase
        .from("classes")
        .select(`
          id,
          course,
          course_code,
          room,
          start_time,
          class_enrollments(count)
        `)
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

  // --- Helpers ---
  function formatTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInMins = Math.floor(diffInMs / 60000);
    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return past.toLocaleDateString();
  }

  function formatTimeFromDB(t) {
    if (!t) return "—";
    const [hh, mm] = String(t).split(":");
    let h = Number(hh);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${mm} ${ampm}`;
  }

  const refreshUnreadCount = () => {
    const notes = getNotifications() || [];
    setUnreadCount(notes.filter((n) => !n.read).length);
  };

  // Realtime & Initial Load
  useEffect(() => {
    fetchTodayClasses();
    fetchStats();
    fetchActivities();
    refreshUnreadCount();

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'recent_activities' }, 
        (payload) => {
          const newItem = {
            id: payload.new.id,
            text: payload.new.message,
            time: "Just now"
          };
          setRealActivity(prev => [newItem, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
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
            <button className="mnt-icon-btn" ref={notifRef} onClick={() => {
              setActivityAnchorRect(notifRef.current?.getBoundingClientRect() ?? null);
              setActivityOpen(true);
            }}>
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
        </section>

        {/* BOTTOM */}
        <section className="bottom-grid">
          {/* Recent Activity */}
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

          {/* Today Classes (Fixed Original UI) */}
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