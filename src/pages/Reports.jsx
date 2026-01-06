import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./AdminDashboard.css";
import "./Reports.css";
import ActivityHistoryModal from "../components/ActivityHistoryModal";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faRightFromBracket,
  faMagnifyingGlass,
  faDownload,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export default function Reports() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // ===== Activity (SAME AS ADMIN DASHBOARD) =====
  const [activityOpen, setActivityOpen] = useState(false);
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

  // datatable-like controls
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const reports = useMemo(
    () => [
      {
        id: 1023,
        name: "Juan Dela Cruz",
        email: "juan@example.com",
        subject: "Login Issue",
        message: "I can't log into my account.",
        date: "2023-12-15",
        status: "Open",
      },
      {
        id: 1022,
        name: "Maria Santos",
        email: "maria@example.com",
        subject: "App Crash",
        message: "The app keeps crashing.",
        date: "2023-12-10",
        status: "Resolved",
      },
      {
        id: 1021,
        name: "Kevin Reyes",
        email: "kevin@example.com",
        subject: "Attendanace Problem",
        message: "can't mark attendance.",
        date: "2023-12-05",
        status: "Pending",
      },
      {
        id: 1020,
        name: "Lisa Tan",
        email: "lisa@example.com",
        subject: "Account Help",
        message: "Need help updating profile.",
        date: "2023-11-28",
        status: "Open",
      },
      {
        id: 1019,
        name: "Mark Villanueva",
        email: "mark@example.com",
        subject: "Bug Report",
        message: "Found a bug in the app.",
        date: "2023-11-20",
        status: "Resolved",
      },
      {
        id: 1018,
        name: "Anna Lim",
        email: "anna@example.com",
        subject: "Technical Issue",
        message: "Having trouble with notifications.",
        date: "2023-11-15",
        status: "Open",
      },
      {
        id: 1017,
        name: "John Perez",
        email: "john@example.com",
        subject: "General Inquiry",
        message: "Just have a few questions.",
        date: "2023-11-10",
        status: "Closed",
      },
      {
        id: 1016,
        name: "Grace Mendoza",
        email: "grace@example.com",
        subject: "Feedback",
        message: "Suggestions for the app.",
        date: "2023-11-05",
        status: "Resolved",
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return reports.filter((r) => {
      const okQuery =
        !query ||
        String(r.id).includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.subject.toLowerCase().includes(query) ||
        r.message.toLowerCase().includes(query);

      const okStatus = status === "All" || r.status === status;
      const okFrom = !from || r.date >= from;
      const okTo = !to || r.date <= to;

      return okQuery && okStatus && okFrom && okTo;
    });
  }, [reports, q, status, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(filtered.length, safePage * pageSize);

  const onClear = () => {
    setQ("");
    setStatus("All");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const exportCSV = () => {
    const header = ["ID", "Name", "Email", "Subject", "Message", "Submission Date", "Status"];
    const rows = filtered.map((r) => [
      r.id,
      r.name,
      r.email,
      r.subject,
      r.message,
      r.date,
      r.status,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "reports.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setPage(1);
  }, [q, status, from, to, pageSize]);

  return (
    <div className="app-shell rep">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="reports" />

      {/* SAME TOP BAR AS DASHBOARD */}
      <header className="dash-topbar">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <button className="icon-btn" aria-label="Menu" type="button" onClick={() => setMenuOpen(true)}>
              <FontAwesomeIcon icon={faBars} />
            </button>

            <div>
              <div className="dash-title">Reports</div>
              <div className="dash-subtitle">View submitted reports and status</div>
            </div>
          </div>

          <div className="dash-topbar-right">
            <button className="icon-btn" aria-label="Notifications" type="button" onClick={() => setActivityOpen(true)}>
              <span className="notif-dot" />
              <FontAwesomeIcon icon={faBell} />
            </button>

            <button className="icon-btn" aria-label="Logout" type="button" onClick={() => navigate("/")} title="Logout">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="rep-main">
        <section className="rep-card rep-dt">
          {/* TOP controls like screenshot */}
          <div className="rep-dt-top">
            <div className="rep-dt-search">
              <span className="rep-dt-searchIcon">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
            </div>

            <div className="rep-dt-right">
              <div className="rep-dt-field">
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="Open">Open</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Pending">Pending</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <button className="rep-dt-btn" type="button" onClick={onClear}>
                <span className="rep-dt-btnIco">
                  <FontAwesomeIcon icon={faXmark} />
                </span>
                Clear
              </button>

              <button className="rep-dt-btn primary" type="button" onClick={exportCSV}>
                <span className="rep-dt-btnIco">
                  <FontAwesomeIcon icon={faDownload} />
                </span>
                Export CSV
              </button>
            </div>
          </div>

          {/* SUB row: showing + show entries */}
          <div className="rep-dt-sub">
            <div className="rep-dt-showing">
              Showing {showingFrom} to {showingTo} of {filtered.length} entries
            </div>

            <div className="rep-dt-entries">
              <span>Show</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          {/* Optional date range row (keeps your same filters) */}
          <div className="rep-dt-filters">
            <div className="rep-dt-mini">
              <label>From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="rep-dt-mini">
              <label>To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          {/* Table */}
          <div className="rep-dt-table">
            <div className="rep-dt-thead">
              <div>ID</div>
              <div>Name</div>
              <div>Email</div>
              <div>Subject</div>
              <div>Message</div>
              <div>Submission Date</div>
              <div>Status</div>
            </div>

            <div className="rep-dt-tbody">
              {paged.map((r) => (
                <div className="rep-dt-row" key={r.id}>
                  <div>{r.id}</div>

                  <div className="rep-dt-nameCell">
                    <span className="rep-dt-avatar">{initials(r.name)}</span>
                    <span className="rep-dt-name">{r.name}</span>
                  </div>

                  <div className="rep-email">{r.email}</div>
                  <div className="rep-subject">{r.subject}</div>
                  <div className="rep-message">{r.message}</div>
                  <div>{r.date}</div>

                  <div className="rep-dt-statusCell">
                    <span className={`rep-pill ${pillClass(r.status)}`}>{r.status}</span>
                  </div>
                </div>
              ))}

              {paged.length === 0 && <div className="rep-dt-empty">No reports found.</div>}
            </div>
          </div>

          {/* Pagination bottom-right like screenshot */}
          <div className="rep-dt-pagination">
            <button
              className="rep-dt-pageBtn"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              ‹ Previous
            </button>

            <button className="rep-dt-pageNum active" type="button">
              {safePage}
            </button>

            <button
              className="rep-dt-pageBtn"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              type="button"
            >
              Next ›
            </button>
          </div>
        </section>
      </main>

      {/* Activity Modal (Bell) */}
      <ActivityHistoryModal open={activityOpen} onClose={() => setActivityOpen(false)} items={activity} />
    </div>
  );
}

/* helpers */
function csvEscape(v) {
  const s = String(v ?? "");
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function pillClass(s) {
  if (s === "Open") return "open";
  if (s === "Resolved") return "resolved";
  if (s === "Pending") return "pending";
  if (s === "Closed") return "closed";
  return "";
}

function initials(name) {
  const parts = String(name || "").split(" ").filter(Boolean);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return (a + b) || "U";
}
