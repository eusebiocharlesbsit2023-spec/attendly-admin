import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./AttendanceRecords.css";

export default function AttendanceRecords() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);
  const notifRef = useRef(null);

  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [clazz, setClazz] = useState("All Classes");
  const [status, setStatus] = useState("All Status");
  const [prof, setProf] = useState("All Professors");

  const [page, setPage] = useState(1);
  const pageSize = 6;

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
  }, [filtered, safePage]);

  const exportCSV = () => {
    const header = ["Student Name", "Student ID", "Date", "Classes", "Status", "Professors"];
    const rows = filtered.map((r) => [r.student, r.id, r.date, r.className, r.status, r.professor]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

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
  }, [q, date, clazz, status, prof]);

  return (
    <div className="app-shell ar">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="attendance" />

      {/* Top Bar */}
      <header className="ar-topbar">
        <div className="ar-topbar-inner">
          <div className="ar-topbar-left">
            <div>
              <div className="ar-title">Attendance Records</div>
              <div className="ar-subtitle">Track attendance record</div>
            </div>
          </div>

          <div className="ar-topbar-right">
            <button
              className="ar-icon-btn bell-btn"
              ref={notifRef}
              type="button"
              aria-label="Notifications"
              onClick={() => {
                setActivityAnchorRect(notifRef.current?.getBoundingClientRect() ?? null);
                setActivityOpen(true);
              }}
            >
              <span className="ar-notif-dot" />
              <Svg name="bell" />
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

        {/* Filters */}
        <section className="ar-filters card">
          <div className="ar-searchRow">
            <div className="ar-search">
              <span className="ar-searchIcon">
                <Svg name="search" />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or Id"
              />
            </div>
          </div>

          <div className="ar-filterGrid">
            <div className="ar-field">
              <label>Date</label>
              <div className="ar-inputWithIcon">
                <span className="ar-miniIcon">
                  <Svg name="calendar" />
                </span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="ar-field">
              <label>Class</label>
              <select value={clazz} onChange={(e) => setClazz(e.target.value)}>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="ar-field">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>All Status</option>
                <option>Present</option>
                <option>Absent</option>
                <option>Late</option>
              </select>
            </div>

            <div className="ar-field">
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
        </section>

        {/* Export */}
        <div className="ar-exportRow">
          <button className="ar-exportBtn" type="button" onClick={exportCSV}>
            <span className="ar-exportIcon">
              <Svg name="download" />
            </span>
            Export CSV
          </button>
        </div>

        {/* Table */}
        <section className="ar-tableWrap">
          <div className="ar-table card">
            <div className="ar-thead">
              <div>Student Name</div>
              <div>Date</div>
              <div>Classes</div>
              <div>Status</div>
              <div>Professors</div>
            </div>

            <div className="ar-tbody">
              {paged.map((r, idx) => (
                <div className={`ar-row ${idx % 2 === 1 ? "alt" : ""}`} key={r.id + r.date}>
                  <div className="ar-studentCell">
                    <span className="ar-avatar">{initials(r.student)}</span>
                    <div className="ar-studentName">{r.student}</div>
                  </div>

                  <div>{r.date}</div>
                  <div className="ar-classCell">{r.className}</div>

                  <div>
                    <span className={`ar-pill ${pillClass(r.status)}`}>{r.status}</span>
                  </div>

                  <div>{r.professor}</div>
                </div>
              ))}

              {paged.length === 0 && <div className="ar-empty">No records found.</div>}
            </div>
          </div>

          {/* Pagination */}
          <div className="ar-pagination">
            <button
              className="ar-pageBtn"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>

            <button
              className={`ar-pageNum ${safePage === 1 ? "active" : ""}`}
              onClick={() => setPage(1)}
            >
              1
            </button>

            {totalPages > 2 && <span className="ar-ellipsis">…</span>}

            {totalPages >= 2 && (
              <button
                className={`ar-pageNum ${safePage === totalPages ? "active" : ""}`}
                onClick={() => setPage(totalPages)}
              >
                {totalPages}
              </button>
            )}

            <button
              className="ar-pageBtn"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </button>
          </div>
        </section>
      </main>
      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        items={[]}
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

function Svg({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (name) {
    case "bell":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" stroke="currentColor" strokeWidth="2" />
          <path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" />
          <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <path d="M7 3v2M17 3v2" stroke="currentColor" strokeWidth="2" />
          <path d="M4 7h16" stroke="currentColor" strokeWidth="2" />
          <rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 3v10" stroke="currentColor" strokeWidth="2" />
          <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="2" />
          <path d="M4 21h16" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
}
