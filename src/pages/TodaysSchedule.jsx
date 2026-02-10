import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./TodaysSchedule.css";
import supabase from "../helper/supabaseClient";

export default function TodaysSchedule() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // ---- HELPERS ----
  const dayKey = (d) => {
    const map = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return map[d];
  };

  const dayLabel = (d) => {
    const map = {
      sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday",
      thu: "Thursday", fri: "Friday", sat: "Saturday",
    };
    return map[d] || d;
  };

  const formatTime = (t) => {
    if (!t) return "";
    const [hh, mm] = String(t).split(":");
    const h = Number(hh);
    const m = Number(mm ?? 0);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = ((h + 11) % 12) + 1;
    const mm2 = String(m).padStart(2, "0");
    return `${h12}:${mm2} ${ampm}`;
  };

  const dateLabel = useMemo(() => {
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "long" });
    const day = now.getDate();
    const year = now.getFullYear();
    return `${month} ${day}, ${year}`;
  }, []);

  // ---- STATUS LOGIC ----
  const computeStatus = (c, session) => {
    if (c.archived) return { text: "Inactive", type: "ended" };

    const now = new Date();
    const [sh, sm] = String(c.start_time || "00:00").split(":");
    const [eh, em] = String(c.end_time || "00:00").split(":");

    const start = new Date(now);
    start.setHours(Number(sh), Number(sm || 0), 0, 0);

    const end = new Date(now);
    end.setHours(Number(eh), Number(em || 0), 0, 0);

    // Logic for 2 hours before schedule
    const twoHoursBefore = new Date(start.getTime() - 2 * 60 * 60 * 1000);

    // 1. Check kung may active session na sa DB (Priority)
    if (session) {
      if (session.status === "Started") return { text: "Class In-Progress", type: "inprogress" };
      if (session.status === "Ended") return { text: "Class Ended", type: "ended" };
    }

    // 2. Kung tapos na ang schedule at walang session record
    if (now > end) return { text: "Class Ended", type: "ended" };

    // 3. Pending Logic (Nasa loob ng 2-hour window bago mag-start)
    if (now >= twoHoursBefore && now < start) {
      return { text: "Pending", type: "pending" }; // Ginawang 'pending'
    }

    // 4. Upcoming Logic (More than 2 hours pa)
    if (now < twoHoursBefore) {
      return { text: "Upcoming", type: "upcoming" }; // Ginawang 'upcoming'
    }

    // Fallback kung nasa loob na ng oras pero wala pang session
    return { text: "Pending", type: "ongoing" };
  };

  // ---- FETCH LOGIC ----
  const fetchToday = async () => {
    setLoading(true);
    const now = new Date();
    const todayKey = dayKey(now.getDay());
    const dateToday = now.toISOString().split('T')[0];

    try {
      // 1. Fetch classes scheduled today
      const { data: classes, error: clsErr } = await supabase
        .from("classes")
        .select("*")
        .eq("day_of_week", todayKey)
        .eq("archived", false)
        .order("start_time", { ascending: true });

      if (clsErr) throw clsErr;

      if (!classes || classes.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const classIds = classes.map((c) => c.id);

      // 2. Fetch sessions today
      const { data: sessions } = await supabase
        .from("class_sessions")
        .select("*")
        .in("class_id", classIds)
        .eq("session_date", dateToday);

      const sessionMap = Object.fromEntries((sessions || []).map((s) => [s.class_id, s]));

      // 3. Fetch professors names
      const profIds = Array.from(new Set(classes.map((c) => c.professor_id).filter(Boolean)));
      const { data: profs } = await supabase
        .from("professors")
        .select("id, professor_name")
        .in("id", profIds);

      const profMap = Object.fromEntries((profs || []).map((p) => [p.id, p.professor_name]));

      // 4. Fetch student counts
      const { data: enrolls } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .in("class_id", classIds);

      const studentCountMap = {};
      (enrolls || []).forEach((e) => {
        studentCountMap[e.class_id] = (studentCountMap[e.class_id] || 0) + 1;
      });

      // Map to UI
      const mapped = classes.map((c) => {
        const sessionToday = sessionMap[c.id];
        const stat = computeStatus(c, sessionToday);

        return {
          id: c.id,
          title: c.course ?? "Untitled",
          code: c.course_code ?? "",
          professor: profMap[c.professor_id] ?? "Unassigned",
          room: c.room ?? "—",
          time: c.schedule ?? `${dayLabel(todayKey)}: ${formatTime(c.start_time)} - ${formatTime(c.end_time)}`,
          wifi: "N/A",
          students: studentCountMap[c.id] ?? 0,
          status: stat.text,
          statusType: stat.type,
        };
      });

      setRows(mapped);
    } catch (err) {
      console.error("Error fetching today's schedule:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
    // Optional: Refresh status every minute without database fetch
    const interval = setInterval(() => fetchToday(), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-shell schedule">
      <Sidebar active="dashboard" />

      <header className="schedule-topbar">
        <div className="schedule-topbar-inner">
          <div className="schedule-title">Today’s Schedule</div>
          <button className="icon-btn" onClick={() => navigate(-1)} title="Back">
            <Svg name="back" />
          </button>
        </div>
      </header>

      <main className="schedule-main">
        <div className="schedule-header">
          <div className="schedule-date">{dateLabel}</div>
          <button className="export-btn" type="button" onClick={() => window.print()}>
            <Svg name="download" small />
            Export PDF
          </button>
        </div>

        <section className="schedule-grid">
          {loading ? (
            <div className="schedule-empty">Loading schedule...</div>
          ) : rows.length === 0 ? (
            <div className="schedule-empty">No classes scheduled today.</div>
          ) : (
            rows.map((c) => (
              <div className="schedule-card" key={c.id}>
                <div className={`status-pill ${c.statusType}`}>{c.status}</div>
                <div className="card-top">
                  <div className="course-title">{c.title}</div>
                  <div className="students-pill">{c.students} Students</div>
                </div>
                <div className="course-code">{c.code}</div>

                <div className="card-body">
                  <div className="info-row">
                    <Svg name="user" small />
                    <span>{c.professor}</span>
                  </div>
                  <div className="info-row">
                    <Svg name="pin" small />
                    <span>{c.room}</span>
                  </div>
                  <div className="info-row">
                    <Svg name="clock" small />
                    <span>{c.time}</span>
                  </div>
                  <div className="info-row">
                    <Svg name="wifi" small />
                    <span>{c.wifi}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

// SVG Helper stays the same
function Svg({ name, small = false }) {
  const s = small ? 16 : 22;
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none" };

  const icons = {
    back: <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    download: (
      <>
        <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    pin: <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0z" stroke="currentColor" strokeWidth="2" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    wifi: (
      <>
        <path d="M5 10a11 11 0 0114 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 13a7 7 0 018 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M11 16a3 3 0 012 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="19" r="1" fill="currentColor" />
      </>
    ),
  };
  return <svg {...props}>{icons[name]}</svg>;
}