import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./ClassManagement.css";
import ConfirmModal from "../components/ConfirmModal";
import EditClassModal from "../components/EditClassModal";


export default function ClassManagement() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // ===== Edit Class + Apply Changes Confirm =====
const [editOpen, setEditOpen] = useState(false);
const [applyOpen, setApplyOpen] = useState(false);
const [editingClass, setEditingClass] = useState(null);
const [pendingEdit, setPendingEdit] = useState(null);

const onEdit = (clazzObj) => {
  setEditingClass(clazzObj);
  setEditOpen(true);
};

const onEditSaveClick = (updatedClass) => {
  setPendingEdit(updatedClass);
  setApplyOpen(true);
};

const applyYes = () => {
  setApplyOpen(false);
  setEditOpen(false);

  // later: update state or API
  alert(`Applied changes: ${pendingEdit?.code} -> ${pendingEdit?.status}`);

  setPendingEdit(null);
  setEditingClass(null);
};

const applyCancel = () => setApplyOpen(false);


  // filters
  const [q, setQ] = useState("");
  const [clazz, setClazz] = useState("All Classes");
  const [status, setStatus] = useState("All Status");
  const [prof, setProf] = useState("All Professors");

  const classes = useMemo(
    () => [
      {
        name: "Introduction to Computer Science",
        code: "CS101",
        professor: "Mrs. Sadie Mayers",
        room: "Room 303",
        schedule: "Monday: 9:00 - 11:00 AM",
        wifi: "Lab303_Wifi",
        status: "Active",
      },
      {
        name: "Introduction to Computing",
        code: "CS102",
        professor: "Mr. Michael Philips",
        room: "Room 301",
        schedule: "Tuesday: 1:00 - 3:00 PM",
        wifi: "Lab301_Wifi",
        status: "Active",
      },
      {
        name: "Sports and Fitness",
        code: "PathFit",
        professor: "Mr. Leviticus Cornwall",
        room: "Room 302",
        schedule: "Friday: 9:00 - 11:00 AM",
        wifi: "Lab302_Wifi",
        status: "Active",
      },
      {
        name: "Database Management System",
        code: "CS103",
        professor: "Mr. Arthur Morgan",
        room: "Room 304",
        schedule: "Monday: 7:00 - 10:00 AM",
        wifi: "Lab304_Wifi",
        status: "Active",
      },
    ],
    []
  );

  const classOptions = useMemo(() => {
    const set = new Set(classes.map((c) => c.code));
    return ["All Classes", ...Array.from(set)];
  }, [classes]);

  const profOptions = useMemo(() => {
    const set = new Set(classes.map((c) => c.professor));
    return ["All Professors", ...Array.from(set)];
  }, [classes]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return classes.filter((c) => {
      const matchesQuery =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query);

      const matchesClass = clazz === "All Classes" || c.code === clazz;
      const matchesStatus = status === "All Status" || c.status === status;
      const matchesProf = prof === "All Professors" || c.professor === prof;

      return matchesQuery && matchesClass && matchesStatus && matchesProf;
    });
  }, [classes, q, clazz, status, prof]);

  const stats = useMemo(() => {
    const total = classes.length;
    const activeCount = classes.filter((c) => c.status === "Active").length;
    const inactiveCount = classes.filter((c) => c.status === "Inactive").length;
    return { total, activeCount, inactiveCount };
  }, [classes]);

  const exportCSV = () => {
    const header = ["Class Name", "Code", "Professor", "Room", "Schedule", "WiFi", "Status"];
    const rows = filtered.map((c) => [c.name, c.code, c.professor, c.room, c.schedule, c.wifi, c.status]);
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "classes.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // demo only

  const onDelete = (name) => alert(`Delete: ${name} (UI only)`);

  useEffect(() => {
    // reset filters if needed later
  }, []);

  return (
    <div className="cm">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="dashboard" />

      {/* Topbar */}
      <header className="cm-topbar">
        <div className="cm-topbar-inner">
          <div className="cm-topbar-left">
            <button className="cm-icon-btn" onClick={() => setMenuOpen(true)} aria-label="Menu" type="button">
              <Svg name="menu" />
            </button>

            <div className="cm-title">Class Management</div>
          </div>

          <div className="cm-topbar-right">
            <button className="cm-icon-btn" aria-label="Notifications" type="button">
              <span className="cm-notif-dot" />
              <Svg name="bell" />
            </button>

            <button className="cm-icon-btn" aria-label="Logout" type="button" onClick={() => navigate("/")}>
              <Svg name="logout" />
            </button>
          </div>
        </div>
      </header>

      <main className="cm-main">
        {/* Stats */}
        <section className="cm-stats">
          <div className="cm-stat cm-stat-white">
            <div className="cm-stat-label">Total Classes</div>
            <div className="cm-stat-value">{stats.total}</div>
          </div>

          <div className="cm-stat cm-stat-green">
            <div className="cm-stat-label">Active Classes</div>
            <div className="cm-stat-value">{stats.activeCount}</div>
          </div>

          <div className="cm-stat cm-stat-red">
            <div className="cm-stat-label">Inactive Classes</div>
            <div className="cm-stat-value">{stats.inactiveCount}</div>
          </div>
        </section>

        {/* Filters panel */}
        <section className="cm-filters card">
          <div className="cm-searchRow">
            <div className="cm-search">
              <span className="cm-searchIcon"><Svg name="search" /></span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or Id"
              />
            </div>
          </div>

          <div className="cm-filterGrid">
            <div className="cm-field">
              <label>Class</label>
              <select value={clazz} onChange={(e) => setClazz(e.target.value)}>
                {classOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="cm-field">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div className="cm-field">
              <label>Professors</label>
              <select value={prof} onChange={(e) => setProf(e.target.value)}>
                {profOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <button className="cm-exportBtn" type="button" onClick={exportCSV}>
              <span className="cm-exportIcon"><Svg name="download" /></span>
              Export CSV
            </button>
          </div>
        </section>

        {/* Cards grid */}
        <section className="cm-cards">
          {filtered.map((c) => (
            <div className="cm-card" key={c.code + c.name}>
              <div className="cm-card-top">
                <div>
                  <div className="cm-card-name">{c.name}</div>
                  <div className="cm-card-code">{c.code}</div>
                </div>

                <span className={`cm-pill ${c.status === "Active" ? "active" : "inactive"}`}>
                  {c.status}
                </span>
              </div>

              <div className="cm-card-body">
                <div className="cm-line">
                  <span className="cm-ico"><Svg name="user" /></span>
                  <span>{c.professor}</span>
                </div>
                <div className="cm-line">
                  <span className="cm-ico"><Svg name="pin" /></span>
                  <span>{c.room}</span>
                </div>
                <div className="cm-line">
                  <span className="cm-ico"><Svg name="clock" /></span>
                  <span>{c.schedule}</span>
                </div>
                <div className="cm-line">
                  <span className="cm-ico"><Svg name="wifi" /></span>
                  <span>{c.wifi}</span>
                </div>
              </div>

              <div className="cm-card-actions">
                <button className="cm-editBtn" type="button" onClick={() => onEdit(c)}>
                  <span className="cm-editIco"><Svg name="edit" /></span>
                  Edit
                </button>

                <button className="cm-trashBtn" type="button" onClick={() => onDelete(c.name)} aria-label="Delete">
                  <Svg name="trash" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && <div className="cm-empty">No classes found.</div>}
        </section>
      </main>
      <EditClassModal
       open={editOpen}
       clazz={editingClass}
       allClasses={classes}
       onClose={() => setEditOpen(false)}
       onSaveClick={onEditSaveClick}
      />

      <ConfirmModal
       open={applyOpen}
       title="Apply Changes?"
       onYes={applyYes}
       onCancel={applyCancel}
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

/* icons */
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
        <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M10 16l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 12h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 7a4 4 0 014 4v2a4 4 0 01-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "wifi":
      return (
        <svg {...common}>
          <path d="M5 12.55a11 11 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8.5 15.5a6 6 0 0 1 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M11 18.5a2 2 0 0 1 2 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M6 6l1 16h10l1-16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    default:
      return null;
  }
}
