import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./AttendanceRecords.css";

/* ===== Font Awesome ===== */
import {
  faBell,
  faMagnifyingGlass,
  faCalendarDays,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import supabase from "../helper/supabaseClient";

function toDateOnly(d) {
  // turn timestamp -> YYYY-MM-DD (local)
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function fetchAttendance({ q, date, clazz, status, prof }) {
  let query = supabase
    .from("v_attendance_records")
    .select(
      "attendance_id,status,time_in,session_date,session_started_at,class_name,student_name,student_number,professor_name"
    )
    .order("session_started_at", { ascending: false });

  // search (student_name or student_number)
  const search = q.trim();
  if (search) {
    // ilike on both columns
    query = query.or(`student_name.ilike.%${search}%,student_number.ilike.%${search}%`);
  }

  // date filter (based on session_started_at)
  if (date) query = query.eq("session_date", date);

  // class filter
  if (clazz !== "All Classes") query = query.eq("class_name", clazz);

  // status filter
  if (status !== "All Status") query = query.eq("status", status);

  // prof filter
  if (prof !== "All Professors") query = query.eq("professor_name", prof);

  const { data, error } = await query;
  if (error) throw error;

  // map to your UI format
  return (data ?? []).map((row) => ({
    id: row.student_number ?? row.attendance_id, // UI "Student ID"
    student: row.student_name ?? "Unknown",
    date: row.session_date ?? "",
    className: row.class_name ?? "",
    status: row.status ?? "",
    professor: row.professor_name ?? "—",
  }));
}

export default function AttendanceRecords() {
  const navigate = useNavigate();

  // ✅ FIX: missing notifRef + anchor rect
  const notifRef = useRef(null);
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);

  const [activityOpen, setActivityOpen] = useState(false);

  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [clazz, setClazz] = useState("All Classes");
  const [status, setStatus] = useState("All Status");
  const [prof, setProf] = useState("All Professors");

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // NEW: datatable-like "Show entries"
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

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

  const classOptions = useMemo(() => {
    const set = new Set(records.map((r) => r.className));
    return ["All Classes", ...Array.from(set)];
  }, [records]);

  const profOptions = useMemo(() => {
    const set = new Set(records.map((r) => r.professor));
    return ["All Professors", ...Array.from(set)];
  }, [records]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return records.filter((r) => {
      const matchesQuery =
        !query ||
        r.student.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query);

      const matchesDate = !date || r.date === date;
      const matchesClass = clazz === "All Classes" || r.className === clazz;
      const matchesStatus = status === "All Status" || r.status === status;
      const matchesProf = prof === "All Professors" || r.professor === prof;

      return matchesQuery && matchesDate && matchesClass && matchesStatus && matchesProf;
    });
  }, [records, q, date, clazz, status, prof]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const present = filtered.filter((r) => r.status === "Present").length;
    const absent = filtered.filter((r) => r.status === "Absent").length;
    const late = filtered.filter((r) => r.status === "Late").length;
    return { total, present, absent, late };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const showingFrom = paged.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, filtered.length);

  const exportCSV = () => {
    const header = [
      "Student Name",
      "Student ID",
      "Date",
      "Classes",
      "Status",
      "Professors",
    ];
    const rows = filtered.map((r) => [
      r.student,
      r.id,
      r.date,
      r.className,
      r.status,
      r.professor,
    ]);

    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance-records.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const rows = await fetchAttendance({ q, date, clazz, status, prof });
        if (!alive) return;
        setRecords(rows);
      } catch (e) {
        if (!alive) return;
        setErr(e.message ?? String(e));
        setRecords([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [q, date, clazz, status, prof]);

  return (
    <div className="app-shell ar">
      <Sidebar open={false} active="attendance" />

      {/* Top Bar */}
      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="ar-topbar-left">
            <div>
              <div className="ar-title">Attendance Records</div>
              <div className="ar-subtitle">Track attendance record</div>
            </div>
          </div>

          <div className="ar-topbar-right">
            <button
              className="ar-icon-btn"
              type="button"
              aria-label="Notifications"
              ref={notifRef}
              onClick={() => {
                setActivityAnchorRect(notifRef.current?.getBoundingClientRect() ?? null);
                setActivityOpen(true);
              }}
            >
              <span className="mnt-notif-dot" />
              <FontAwesomeIcon icon={faBell} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="ar-main">
        {/* Stats */}
        <section className="ar-stats">
          <div className="ar-stat ar-stat-white">
            <div className="ar-stat-label">Total Students</div>
            <div className="ar-stat-value">{stats.total}</div>
          </div>

          <div className="ar-stat ar-stat-green">
            <div className="ar-stat-label">Present</div>
            <div className="ar-stat-value">{stats.present}</div>
          </div>

          <div className="ar-stat ar-stat-red">
            <div className="ar-stat-label">Absent</div>
            <div className="ar-stat-value">{stats.absent}</div>
          </div>

          <div className="ar-stat ar-stat-yellow">
            <div className="ar-stat-label">Late</div>
            <div className="ar-stat-value">{stats.late}</div>
          </div>
        </section>

        {/* DataTable-like controls + table */}
        <section className="ar-dt _card">
          <div className="ar-dt-top">
            <div className="ar-dt-search">
              <span className="ar-dt-searchIcon">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
            </div>

            <div className="ar-dt-right">
              <div className="ar-dt-field">
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>All Status</option>
                  <option>Present</option>
                  <option>Absent</option>
                  <option>Late</option>
                </select>
              </div>

              <button className="ar-dt-btn primary" type="button" onClick={exportCSV}>
                <span className="ar-dt-btnIco">
                  <FontAwesomeIcon icon={faDownload} />
                </span>
                Export CSV
              </button>
            </div>
          </div>

          <div className="ar-dt-sub">
            <div className="ar-dt-showing">
              Showing {showingFrom} to {showingTo} of {filtered.length} entries
            </div>

            <div className="ar-dt-entries">
              <span>Show</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="ar-dt-filters">
            <div className="ar-dt-mini">
              <label>Date</label>
              <div className="ar-dt-date">
                <span className="ar-dt-miniIcon">
                  <FontAwesomeIcon icon={faCalendarDays} />
                </span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="ar-dt-mini">
              <label>Class</label>
              <select value={clazz} onChange={(e) => setClazz(e.target.value)}>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="ar-dt-mini">
              <label>Professors</label>
              <select value={prof} onChange={(e) => setProf(e.target.value)}>
                {profOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ar-dt-table">
            <div className="ar-dt-thead">
              <div>Student Name</div>
              <div>Student ID</div>
              <div>Date</div>
              <div>Classes</div>
              <div>Professors</div>
              <div>Status</div>
            </div>

            <div className="ar-dt-tbody">
              {loading && <div className="ar-dt-empty">Loading...</div>}
              {!loading && err && <div className="ar-dt-empty">Error: {err}</div>}
              {!loading && !err && paged.length === 0 && (
                <div className="ar-dt-empty">No records found.</div>
              )}

              {paged.map((r) => (
                <div className="ar-dt-row" key={r.id + r.date}>
                  <div className="ar-dt-studentCell">
                    <span className="ar-dt-avatar">{initials(r.student)}</span>
                    <div className="ar-dt-studentName">{r.student}</div>
                  </div>

                  <div>{r.id}</div>
                  <div>{r.date}</div>
                  <div className="ar-dt-wrap">{r.className}</div>

                  {/* ✅ SWAPPED: professor muna */}
                  <div>{r.professor}</div>

                  {/* ✅ SWAPPED: status last */}
                  <div>
                    <span className={`ar-pill ${pillClass(r.status)}`}>{pillClass(r.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ar-dt-pagination">
            <button
              className="ar-dt-pageBtn"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              ‹ Previous
            </button>

            <button className="ar-dt-pageNum active" type="button">
              {safePage}
            </button>

            <button
              className="ar-dt-pageBtn"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              type="button"
            >
              Next ›
            </button>
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

/* helpers */
function csvEscape(v) {
  const s = String(v ?? "");
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function pillClass(status) {
  if (status === "present") return "Present";
  if (status === "absent") return "Absent";
  return "Late";
}

function initials(name) {
  const parts = name.split(" ").filter(Boolean);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return (a + b) || "U";
}
