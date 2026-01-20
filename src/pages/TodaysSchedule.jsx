import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./TodaysSchedule.css";
import supabase from "../helper/supabaseClient";

export default function TodaysSchedule() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]); // classes for today

  // ---- helpers
  const dayKey = (d) => {
  const map = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return map[d];
};


  const dayLabel = (d) => {
    const map = {
      sun: "Sunday",
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
    };
    return map[d] || "";
  };

  const formatTime = (t) => {
    // t expected like "09:00:00" or "09:00"
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
    const dk = dayKey(now.getDay());
    const month = now.toLocaleString("en-US", { month: "long" });
    const day = now.getDate();
    const year = now.getFullYear();
    return `${month} ${day}, ${year}`;
  }, []);

  const computeStatus = (c) => {
    // simple status based on time today
    if (c.status === "Inactive") return { text: "Inactive", type: "ended" };

    const now = new Date();
    const [sh, sm] = String(c.start_time || "00:00").split(":");
    const [eh, em] = String(c.end_time || "00:00").split(":");

    const start = new Date(now);
    start.setHours(Number(sh), Number(sm || 0), 0, 0);

    const end = new Date(now);
    end.setHours(Number(eh), Number(em || 0), 0, 0);

    if (now < start) return { text: "Upcoming", type: "ongoing" };
    if (now >= start && now <= end) return { text: "Class In-Progress", type: "inprogress" };
    return { text: "Class Ended", type: "ended" };
  };

  const fetchToday = async () => {
    setLoading(true);

    const now = new Date();
    const todayKey = dayKey(now.getDay());

    // 1) classes scheduled today (not archived)
    const { data: classes, error: clsErr } = await supabase
      .from("classes")
      .select("id, course, course_code, room, day_of_week, start_time, end_time, professor_id, archived, schedule")
      .eq("day_of_week", todayKey)
      .order("start_time", { ascending: true });

    if (clsErr) {
      console.log("Fetch today classes error:", clsErr.message);
      setRows([]);
      setLoading(false);
      return;
    }

    // 2) professor names map
    const profIds = Array.from(new Set((classes || []).map((c) => c.professor_id).filter(Boolean)));
    let profMap = {};

    if (profIds.length) {
      const { data: profs, error: profErr } = await supabase
        .from("professors")
        .select("id, professor_name")
        .in("id", profIds);

      if (profErr) console.log("Fetch professors error:", profErr.message);
      profMap = Object.fromEntries((profs || []).map((p) => [p.id, p.professor_name]));
    }

    // 3) student count per class (from class_enrollments)
    const classIds = (classes || []).map((c) => c.id);
    let studentCountMap = {};

    if (classIds.length) {
      const { data: enrolls, error: enrErr } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .in("class_id", classIds);

      if (enrErr) {
        console.log("Fetch enrollments error:", enrErr.message);
      } else {
        for (const e of enrolls || []) {
          studentCountMap[e.class_id] = (studentCountMap[e.class_id] || 0) + 1;
        }
      }
    }

    // map to UI cards
    const mapped = (classes || []).map((c) => {
      const status = c.archived ? "Inactive" : "Active";
      const stat = computeStatus({ ...c, status });

      return {
        id: c.id,
        title: c.course ?? "Untitled",
        code: c.course_code ?? "",
        professor: profMap[c.professor_id] ?? "Unassigned",
        room: c.room ?? "—",
        time:
          c.schedule ??
          `${dayLabel(todayKey)}: ${formatTime(c.start_time)} - ${formatTime(c.end_time)}`,
        wifi: "N/A",
        students: studentCountMap[c.id] ?? 0,
        status: stat.text,
        statusType: stat.type,
      };
    });

    setRows(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchToday();
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

              {/* ✅ NEW: wrap info rows so we can control vertical spacing */}
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
                  <Svg name="pin" small />
                  <span>{c.room}</span>
                </div>

                <div className="info-row">
                  <Svg name="clock" small />
                  <span>{c.time}</span>
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

/* ===== SVG HELPER ===== */
function Svg({ name, small = false }) {
  const s = small ? 16 : 22;
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none" };

  const icons = {
    back: <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    download: (
      <>
        <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M8 10l4 4 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
