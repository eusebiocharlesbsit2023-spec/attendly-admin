import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./ManageAdmin.css";
import "./AdminDashboard.css";

import CreateAdminModal from "../components/CreateAdminModal";
import SmallConfirmModal from "../components/SmallConfirmModal";

/* =========================
   Role-only Edit Modal
========================= */
function EditAdminRoleModal({ open, admin, onClose, onSaveClick }) {
  const [role, setRole] = useState(admin?.role || "Admin");

  // keep role in sync when opening on different row
  useEffect(() => {
    setRole(admin?.role || "Admin");
  }, [admin, open]);

  if (!open) return null;

  return (
    <div className="esm-overlay" onClick={onClose}>
      <div className="esm-card" onClick={(e) => e.stopPropagation()}>
        <div className="esm-row">
          <div className="esm-label">Admin ID</div>
          <div className="esm-value">{admin?.id}</div>
        </div>

        <div className="esm-row">
          <div className="esm-label">Full Name</div>
          <div className="esm-value">{admin?.fullName}</div>
        </div>

        <div className="esm-row">
          <div className="esm-label">Username</div>
          <div className="esm-value">{admin?.username}</div>
        </div>

        <div className="esm-row">
          <div className="esm-label">Role</div>
          <div className="esm-statusWrap">
            <select className="esm-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Admin</option>
              <option>Super Admin</option>
            </select>
          </div>
        </div>

        <button
          className="esm-save"
          type="button"
          onClick={() =>
            onSaveClick({
              id: admin?.id,
              role,
            })
          }
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default function ManageAdmin() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All Roles");
  const [status, setStatus] = useState("All Status");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);

  // ✅ Toast (temporary notification)
  const [toast, setToast] = useState({ open: false, message: "", type: "info" });

  const showToast = (message, type = "info") => {
    setToast({ open: true, message, type });
  };

  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, open: false })), 2500);
    return () => clearTimeout(t);
  }, [toast.open]);

  // Initial rows
  const initialRows = useMemo(
    () => [
      { id: "ADM1", fullName: "John Doe", username: "admin1", role: "Admin", status: "Active" },
      { id: "ADM2", fullName: "Jane Smith", username: "admin2", role: "Super Admin", status: "Active" },
      { id: "ADM3", fullName: "Michael Johnson", username: "admin3", role: "Admin", status: "Inactive" },
      { id: "ADM4", fullName: "Sarah Brown", username: "admin4", role: "Admin", status: "Active" },
      { id: "ADM5", fullName: "Emily Clark", username: "admin5", role: "Admin", status: "Active" },
    ],
    []
  );

  const [rows, setRows] = useState(initialRows);

  // ===== Create Modal =====
  const [createOpen, setCreateOpen] = useState(false);

  const onCreate = () => setCreateOpen(true);

  const handleCreate = (payload) => {
    const newId = `ADM${rows.length + 1}`;
    const newRow = {
      id: newId,
      fullName: payload.fullName,
      username: payload.username,
      role: payload.role,
      status: "Active",
    };

    setRows((prev) => [newRow, ...prev]);
    setCreateOpen(false);

    // ✅ removed alert -> temporary toast
    showToast(`Admin created: ${payload.fullName} (${payload.role})`, "success");
  };

  // ===== Edit Role (only role editable) =====
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  // Confirm Apply Role Change
  const [applyOpen, setApplyOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);

  const onEdit = (r) => {
    setEditingRow(r);
    setEditRoleOpen(true);
  };

  const onEditSaveClick = (payload) => {
    // payload: { id, role }
    setPendingRoleChange(payload);
    setEditRoleOpen(false);
    setApplyOpen(true);
  };

  const applyYes = () => {
    const { id, role: newRole } = pendingRoleChange || {};
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, role: newRole } : x)));

    setApplyOpen(false);
    setPendingRoleChange(null);
    setEditingRow(null);

    // ✅ removed alert -> temporary toast
    showToast(`Role updated: ${id} → ${newRole}`, "success");
  };

  const applyCancel = () => {
    setApplyOpen(false);
    setPendingRoleChange(null);
  };

  // ===== Delete confirm =====
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const onDelete = (r) => {
    // ✅ Hard rule: super admin can't delete (even if user clicks somehow)
    if (r.role === "Super Admin") {
      // ✅ removed alert -> temporary toast
      showToast("Super Admin accounts cannot be deleted.", "danger");
      return;
    }
    setPendingDelete(r);
    setDeleteOpen(true);
  };

  const deleteYes = () => {
    // ✅ Extra safety: block delete if super admin
    if (pendingDelete?.role === "Super Admin") {
      setDeleteOpen(false);
      setPendingDelete(null);
      showToast("Super Admin accounts cannot be deleted.", "danger");
      return;
    }

    const deletedId = pendingDelete?.id;
    setRows((prev) => prev.filter((x) => x.id !== pendingDelete.id));
    setDeleteOpen(false);
    setPendingDelete(null);

    showToast(`Deleted admin: ${deletedId}`, "danger");
  };

  const deleteCancel = () => {
    setDeleteOpen(false);
    setPendingDelete(null);
  };

  // ===== filtering =====
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

  return (
    // ✅ use app-shell so sidebar fits consistently on ALL pages
    <div className="app-shell dash mam-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="manage-admin" />

      {/* ✅ Toast */}
      {toast.open && (
        <div className={`mam-toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button
            type="button"
            className="mam-toast-x"
            onClick={() => setToast((p) => ({ ...p, open: false }))}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar */}
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

            {/* ❌ Logout button removed */}
          </div>
        </div>
      </header>

      <main className="dash-main mam-main">
        <div className="mam-card">
          <div className="mam-cardTop">
            <button className="mam-createBtn" type="button" onClick={onCreate}>
              <span className="mam-plus">＋</span>
              Create New Admin
            </button>
          </div>

          {/* Filters */}
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
              <button className="mam-miniBtn" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
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
                {pageRows.map((r) => {
                  const superAdmin = r.role === "Super Admin";
                  return (
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

                        {/* ✅ Super Admin can't delete */}
                        <button
                          className={`mam-action del ${superAdmin ? "disabled" : ""}`}
                          onClick={() => onDelete(r)}
                          type="button"
                          disabled={superAdmin}
                          title={superAdmin ? "Super Admin can't be deleted" : "Delete"}
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}

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

          {/* Bottom footer */}
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

      {/* Create New Admin modal */}
      <CreateAdminModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />

      {/* Edit role modal (role-only) */}
      <EditAdminRoleModal
        open={editRoleOpen}
        admin={editingRow}
        onClose={() => setEditRoleOpen(false)}
        onSaveClick={onEditSaveClick}
      />

      {/* Confirm apply role change */}
      <SmallConfirmModal
        open={applyOpen}
        title={`Apply role change for ${pendingRoleChange?.id}?`}
        onYes={applyYes}
        onCancel={applyCancel}
      />

      {/* Confirm delete */}
      <SmallConfirmModal
        open={deleteOpen}
        title={`Delete ${pendingDelete?.id}?`}
        onYes={deleteYes}
        onCancel={deleteCancel}
      />
    </div>
  );
}

/* Icons */
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
          <path d="M14 7a4 4 0 014 4v2a4 4 0 01-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
