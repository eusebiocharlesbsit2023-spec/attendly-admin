import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./ManageAdmin.css";
import "./AdminDashboard.css"; 
import CreateAdminModal from "../components/CreateAdminModal";


export default function ManageAdmin() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All Roles");
  const [status, setStatus] = useState("All Status");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);

  // Demo data (replace with API later)
  const rows = useMemo(
    () => [
      { id: "ADM1", fullName: "John Doe", username: "admin1", role: "Admin", status: "Active" },
      { id: "ADM2", fullName: "Jane Smith", username: "admin2", role: "Super Admin", status: "Active" },
      { id: "ADM3", fullName: "Michael Johnson", username: "admin3", role: "Admin", status: "Inactive" },
      { id: "ADM4", fullName: "Sarah Brown", username: "admin4", role: "Admin", status: "Active" },
      { id: "ADM5", fullName: "Emily Clark", username: "admin5", role: "Admin", status: "Active" },
    ],
    []
  );

  const [createOpen, setCreateOpen] = useState(false);

// demo: add to table (local only)
const handleCreate = (payload) => {
  // you can call API here later
  alert(
    `Created Admin:\nFull Name: ${payload.fullName}\nUsername: ${payload.username}\nRole: ${payload.role}\nTemp Password: ${payload.tempPassword}`
  );
};


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q);

      const matchesRole = role === "All Roles" || r.role === role;
      const matchesStatus = status === "All Status" || r.status === status;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [rows, search, role, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entries));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * entries;
    return filtered.slice(start, start + entries);
  }, [filtered, safePage, entries]);

  const showingFrom = (safePage - 1) * entries + (pageRows.length ? 1 : 0);
  const showingTo = (safePage - 1) * entries + pageRows.length;

  const onCreate = () => setCreateOpen(true);
  const onEdit = (r) => alert(`Edit ${r.id}`);
  const onDelete = (r) => alert(`Delete ${r.id}`);

  return (
    <div className="dash mam-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="manage-admin" />

      {/* Top Bar (same as dashboard) */}
      <header className="dash-topbar">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <button className="icon-btn" aria-label="Menu" type="button" onClick={() => setMenuOpen(true)}>
              <Svg name="menu" />
            </button>

            <div>
              <div className="dash-title">Admin Management</div>
              <div className="dash-subtitle">Manage administrator accounts</div>
            </div>
          </div>

          <div className="dash-topbar-right">
            <button className="icon-btn" aria-label="Notifications" type="button">
              <span className="notif-dot" />
              <Svg name="bell" />
            </button>

            <button className="icon-btn" aria-label="Logout" type="button" onClick={() => navigate("/")} title="Logout">
              <Svg name="logout" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="dash-main mam-main">
        <div className="mam-card">
          <div className="mam-cardTop">
            <button className="mam-createBtn" type="button" onClick={onCreate}>
              <span className="mam-plus">＋</span>
              Create New Admin
            </button>
          </div>

          {/* Filters row like screenshot */}
          <div className="mam-filters">
            <div className="mam-filter">
              <div className="mam-filterLabel">Show</div>
              <input
                className="mam-input"
                placeholder="Search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="mam-filter">
              <div className="mam-filterLabel">All Roles</div>
              <select
                className="mam-select"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setPage(1);
                }}
              >
                <option>All Roles</option>
                <option>Admin</option>
                <option>Super Admin</option>
              </select>
            </div>

            <div className="mam-filter">
              <div className="mam-filterLabel">Status</div>
              <select
                className="mam-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          {/* entries + mini pager */}
          <div className="mam-strip">
            <div className="mam-entries">
              <span>Show</span>
              <select
                value={entries}
                onChange={(e) => {
                  setEntries(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span>entries</span>
            </div>

            <div className="mam-miniPager">
              <button
                className="mam-miniBtn"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              <span className="mam-miniPage">{safePage}</span>
              <button
                className="mam-miniBtn"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
              <span className="mam-miniNext">Next ›</span>
            </div>
          </div>

          {/* Table */}
          <div className="mam-tableWrap">
            <table className="mam-table">
              <thead>
                <tr>
                  <th>Admin ID</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="mam-actionsHead">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.fullName}</td>
                    <td>{r.username}</td>
                    <td>{r.role}</td>
                    <td>
                      <span className={`mam-status ${r.status === "Active" ? "active" : "inactive"}`}>{r.status}</span>
                    </td>
                    <td className="mam-actionsCell">
                      <button className="mam-action edit" onClick={() => onEdit(r)} type="button">
                        ✎ Edit
                      </button>
                      <button className="mam-action del" onClick={() => onDelete(r)} type="button">
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {pageRows.length === 0 && (
                  <tr>
                    <td className="mam-empty" colSpan={6}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom footer like screenshot */}
          <div className="mam-footer">
            <div className="mam-footerLeft">
              Showing {showingFrom} to {showingTo} of {filtered.length} entries
            </div>

            <div className="mam-footerRight">
              <button
                className="mam-footerBtn"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                ‹ Previous
              </button>

              <span className="mam-footerPage">{safePage}</span>

              <button
                className="mam-footerBtn"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                type="button"
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      </main>
      <CreateAdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}


/* Icons (same style you used) */
function Svg({ name, small = false }) {
  const s = small ? 16 : 22;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: small ? "svg small" : "svg",
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
          <path
            d="M14 7a4 4 0 014 4v2a4 4 0 01-4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
