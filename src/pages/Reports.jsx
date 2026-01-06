import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./AdminDashboard.css";
import "./Reports.css";

export default function Reports() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Filters (UI only)
  const [status, setStatus] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

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
        subject: "Payment Problem",
        message: "Payment not going through.",
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
    return reports.filter((r) => {
      const okStatus = status === "All" || r.status === status;
      const okFrom = !from || r.date >= from;
      const okTo = !to || r.date <= to;
      return okStatus && okFrom && okTo;
    });
  }, [reports, status, from, to]);

  const onFilter = () => {
    // UI only - filtering already happens by state
  };

  const onClear = () => {
    setStatus("All");
    setFrom("");
    setTo("");
  };

  return (
    <div className="app-shell rep">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="reports" />

      {/* SAME TOP BAR AS DASHBOARD */}
      <header className="dash-topbar">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <button
              className="icon-btn"
              aria-label="Menu"
              type="button"
              onClick={() => setMenuOpen(true)}
            >
              <Svg name="menu" />
            </button>

            <div>
              <div className="dash-title">Reports</div>
              <div className="dash-subtitle">View submitted reports and status</div>
            </div>
          </div>

          <div className="dash-topbar-right">
            <button className="icon-btn" aria-label="Notifications" type="button">
              <span className="notif-dot" />
              <Svg name="bell" />
            </button>

            <button
              className="icon-btn"
              aria-label="Logout"
              type="button"
              onClick={() => navigate("/")}
              title="Logout"
            >
              <Svg name="logout" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="rep-main">
        <section className="rep-card">
          {/* Filters row */}
          <div className="rep-filters">
            <div className="rep-filter-left">
              <span className="rep-filter-label">Filter by:</span>

              <div className="rep-field">
                <label>Status:</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Open">Open</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Pending">Pending</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="rep-field">
                <label>Date Range:</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                <span className="rep-dash">-</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>

            <div className="rep-filter-right">
              <button className="rep-btn rep-btn-primary" type="button" onClick={onFilter}>
                <span className="rep-btnIcon">
                  <SvgMini name="filter" />
                </span>
                Filter
              </button>

              <button className="rep-btn" type="button" onClick={onClear}>
                <span className="rep-btnIcon">
                  <SvgMini name="x" />
                </span>
                Clear
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rep-table">
            <div className="rep-thead">
              <div>ID</div>
              <div>Name</div>
              <div>Email</div>
              <div>Subject</div>
              <div>Message</div>
              <div>Submission Date</div>
              <div>Status</div>
            </div>

            <div className="rep-tbody">
              {filtered.map((r) => (
                <div className="rep-row" key={r.id}>
                  <div>{r.id}</div>
                  <div>{r.name}</div>
                  <div className="rep-email">{r.email}</div>
                  <div className="rep-subject">{r.subject}</div>
                  <div className="rep-message">{r.message}</div>
                  <div>{r.date}</div>
                  <div>
                    <span className={`rep-pill ${pillClass(r.status)}`}>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rep-footer">
              <div className="rep-entries">
                Showing 1 to {filtered.length} of {reports.length} entries
              </div>

              <div className="rep-pagination">
                <button className="rep-pageBtn" disabled type="button">
                  Previous
                </button>
                <button className="rep-pageBtn active" type="button">
                  1
                </button>
                <button className="rep-pageBtn" disabled type="button">
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function pillClass(s) {
  if (s === "Open") return "open";
  if (s === "Resolved") return "resolved";
  if (s === "Pending") return "pending";
  if (s === "Closed") return "closed";
  return "";
}

/* Same icons used in dashboard */
function Svg({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (name) {
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path
            d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M10 16l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 12h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 7a4 4 0 014 4v2a4 4 0 01-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

/* small icons for buttons */
function SvgMini({ name }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (name) {
    case "filter":
      return (
        <svg {...common}>
          <path
            d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
