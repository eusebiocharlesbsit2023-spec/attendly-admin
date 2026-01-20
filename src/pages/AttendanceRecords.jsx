import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./AttendanceRecords.css";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faMagnifyingGlass, faCalendarDays, faDownload } from "@fortawesome/free-solid-svg-icons";

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

  const records = useMemo(
    () => [
      {
        id: "S-1001",
        student: "Jane Smith",
        date: "2025-12-16",
        className: "Intro to Human Computer Interaction",
        status: "Present",
        professor: "Michael Guerrero",
      },
      {
        id: "S-1002",
        student: "John Smith",
        date: "2025-12-12",
        className: "Database System",
        status: "Present",
        professor: "Juan Dela Cruz",
      },
      {
        id: "S-1003",
        student: "Nicole Margarette",
        date: "2025-12-10",
        className: "System Analysis and Design",
        status: "Absent",
        professor: "Felix Tan",
      },
      {
        id: "S-1004",
        student: "Trisha Nicole",
        date: "2025-12-09",
        className: "Software Engineering",
        status: "Late",
        professor: "Leonardo Davinci",
      },
      {
        id: "S-1005",
        student: "Emma Wilson",
        date: "2025-12-08",
        className: "Information Assurance Security",
        status: "Present",
        professor: "Juan Dela Cruz",
      },
      {
        id: "S-1006",
        student: "Mark Lee",
        date: "2025-12-08",
        className: "Introduction to Computer Science",
        status: "Present",
        professor: "Michael Guerrero",
      },
      {
        id: "S-1007",
        student: "Sarah Kim",
        date: "2025-12-07",
        className: "Database System",
        status: "Present",
        professor: "Felix Tan",
      },
      {
        id: "S-1008",
        student: "Noah Garcia",
        date: "2025-12-07",
        className: "Software Engineering",
        status: "Late",
        professor: "Leonardo Davinci",
      },
      {
        id: "S-1009",
        student: "Ava Santos",
        date: "2025-12-06",
        className: "System Analysis and Design",
        status: "Present",
        professor: "Felix Tan",
      },
      {
        id: "S-1010",
        student: "Liam Cruz",
        date: "2025-12-06",
        className: "Information Assurance Security",
        status: "Present",
        professor: "Juan Dela Cruz",
      },
    ],
    []
  );

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
        !query || r.student.toLowerCase().includes(query) || r.id.toLowerCase().includes(query);

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
    const header = ["Student Name", "Student ID", "Date", "Classes", "Status", "Professors"];
    const rows = filtered.map((r) => [r.student, r.id, r.date, r.className, r.status, r.professor]);

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
    setPage(1);
  }, [q, date, clazz, status, prof, pageSize]);

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
                <label>Status</label>
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
              <div>Status</div>
              <div>Professors</div>
            </div>

            <div className="ar-dt-tbody">
              {paged.map((r) => (
                <div className="ar-dt-row" key={r.id + r.date}>
                  <div className="ar-dt-studentCell">
                    <span className="ar-dt-avatar">{initials(r.student)}</span>
                    <div className="ar-dt-studentName">{r.student}</div>
                  </div>

                  <div>{r.id}</div>
                  <div>{r.date}</div>
                  <div className="ar-dt-wrap">{r.className}</div>

                  <div>
                    <span className={`ar-pill ${pillClass(r.status)}`}>{r.status}</span>
                  </div>

                  <div>{r.professor}</div>
                </div>
              ))}

              {paged.length === 0 && <div className="ar-dt-empty">No records found.</div>}
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
  if (status === "Present") return "present";
  if (status === "Absent") return "absent";
  return "late";
}

function initials(name) {
  const parts = name.split(" ").filter(Boolean);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return (a + b) || "U";
}