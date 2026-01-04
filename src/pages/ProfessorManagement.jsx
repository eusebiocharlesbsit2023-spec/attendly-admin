import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./ProfessorManagement.css";
import AddProfessorModal from "../components/AddProfessorModal";
import ConfirmModal from "../components/ConfirmModal";



export default function ProfessorManagement() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingProf, setPendingProf] = useState(null);

// open form modal
const onAdd = () => setAddOpen(true);

// when click "Add" inside form modal
const handleAddSubmit = (payload) => {
  setPendingProf(payload);

  setAddOpen(false);     
  setConfirmOpen(true); 
};


// YES confirm
const confirmYes = () => {
  setConfirmOpen(false);
  setAddOpen(false);

  alert(`Professor Added:\n${pendingProf?.name}\n${pendingProf?.email}\n${pendingProf?.department}`);
  setPendingProf(null);
};

// Cancel confirm (keep form open)
const confirmCancel = () => setConfirmOpen(false);


  const professors = useMemo(
    () => [
      { name: "John Smith", email: "johnsmith@gmail.com", classes: 6, status: "Active" },
      { name: "Alice Willson", email: "alicewilson@gmail.com", classes: 6, status: "Inactive" },
      { name: "Dakota Johnson", email: "dakotajohnson@gmail.com", classes: 6, status: "Active" },
      { name: "Odette Lancelot", email: "odettelancelot@gmail.com", classes: 6, status: "Active" },
      { name: "Michal Winger", email: "michalwinger@gmail.com", classes: 6, status: "Inactive" },
    ],
    []
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return professors;

    return professors.filter(
      (p) => p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query)
    );
  }, [professors, q]);

  const stats = useMemo(() => {
    const total = professors.length;
    const active = professors.filter((p) => p.status === "Active").length;
    const inactive = professors.filter((p) => p.status === "Inactive").length;
    return { total, active, inactive };
  }, [professors]);

  const exportCSV = () => {
    const header = ["Professor Name", "Email", "Classes", "Status"];
    const rows = filtered.map((p) => [p.name, p.email, p.classes, p.status]);
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "professors.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // demo only
  const onEdit = (name) => alert(`Edit: ${name} (UI only)`);
  const onDelete = (name) => alert(`Delete: ${name} (UI only)`);

  return (
    <div className="pm">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="dashboard" />

      {/* Topbar */}
      <header className="pm-topbar">
        <div className="pm-topbar-inner">
          <div className="pm-topbar-left">
            <button className="pm-icon-btn" onClick={() => setMenuOpen(true)} aria-label="Menu" type="button">
              <Svg name="menu" />
            </button>

            <div>
              <div className="pm-title">Professor Management</div>
              <div className="pm-subtitle">Review list of professors</div>
            </div>
          </div>

          <div className="pm-topbar-right">
            <button className="pm-icon-btn" aria-label="Notifications" type="button">
              <span className="pm-notif-dot" />
              <Svg name="bell" />
            </button>

            <button className="pm-icon-btn" aria-label="Logout" type="button" onClick={() => navigate("/")}>
              <Svg name="logout" />
            </button>
          </div>
        </div>
      </header>

      <main className="pm-main">
        {/* Stats */}
        <section className="pm-stats">
          <div className="pm-stat pm-stat-white">
            <div className="pm-stat-label">Total Professors</div>
            <div className="pm-stat-value">{stats.total}</div>
          </div>

          <div className="pm-stat pm-stat-green">
            <div className="pm-stat-label">Active</div>
            <div className="pm-stat-value">{stats.active}</div>
          </div>

          <div className="pm-stat pm-stat-red">
            <div className="pm-stat-label">Inactive</div>
            <div className="pm-stat-value">{stats.inactive}</div>
          </div>
        </section>

        {/* Search + actions */}
        <section className="pm-tools card">
          <div className="pm-search">
            <span className="pm-searchIcon"><Svg name="search" /></span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email"
            />
          </div>

          <div className="pm-actions">
            <button className="pm-addBtn" type="button" onClick={onAdd} aria-label="Add">
              <Svg name="plus" />
            </button>

            <button className="pm-exportBtn" type="button" onClick={exportCSV}>
              <span className="pm-exportIcon"><Svg name="download" /></span>
              Export CSV
            </button>
          </div>
        </section>

        {/* Table */}
        <section className="pm-table card">
          <div className="pm-thead">
            <div>Professor Name</div>
            <div>Email</div>
            <div>Classes</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          <div className="pm-tbody">
            {filtered.map((p, idx) => (
              <div className={`pm-row ${idx % 2 ? "alt" : ""}`} key={p.email}>
                <div className="pm-nameCell">
                  <span className="pm-avatar">{initials(p.name)}</span>
                  <span>{p.name}</span>
                </div>

                <div className="pm-email">{p.email}</div>
                <div>{p.classes}</div>

                <div>
                  <span className={`pm-pill ${p.status === "Active" ? "active" : "inactive"}`}>
                    {p.status}
                  </span>
                </div>

                <div className="pm-actionIcons">
                  <button className="pm-icoBtn edit" onClick={() => onEdit(p.name)} aria-label="Edit">
                    <Svg name="edit" />
                  </button>
                  <button className="pm-icoBtn del" onClick={() => onDelete(p.name)} aria-label="Delete">
                    <Svg name="trash" />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && <div className="pm-empty">No professors found.</div>}
          </div>
        </section>
      </main>
      <AddProfessorModal
  open={addOpen}
  onClose={() => setAddOpen(false)}
  onSubmit={handleAddSubmit}
/>

<ConfirmModal
  open={confirmOpen}
  title="Add New Professor?"
  onYes={confirmYes}
  onCancel={confirmCancel}
/>

    </div>
  );
}

/* helpers */
function initials(name) {
  const parts = name.split(" ").filter(Boolean);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return (a + b) || "U";
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/* icons (no libs) */
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
    case "plus":
      return (
        <svg {...common}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
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
