import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./ManageAdmin.css";
import "./AdminDashboard.css";

import CreateAdminModal from "../components/CreateAdminModal";
import SmallConfirmModal from "../components/SmallConfirmModal";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

/* =========================
   Role-only Edit Modal
========================= */
function EditAdminRoleModal({ open, admin, onClose, onSaveClick }) {
  const [role, setRole] = useState(admin?.role || "Admin");

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
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);
  const notifRef = useRef(null);

  // ===== Activity (SAME AS ADMIN DASHBOARD) =====
  const [activityOpen, setActivityOpen] = useState(false);
  const activity = useMemo(
    () => [
      { text: "John Smith marked attendance in CS101", time: "2 minutes ago" },
      { text: "Haylee Steinfield marked attendance in CS101", time: "5 minutes ago" },
      { text: "New Student enrolled: Emma Wilson", time: "2 hours ago" },
      { text: "Dakota Johnson marked attendance in CS201", time: "3 hours ago" },
      { text: "Professor Sadie Mayers created class CS102", time: "Yesterday" },
      { text: "Admin changed Alice Willson to Inactive", time: "2 days ago" },
      { text: "Maintenance switched to Online", time: "3 days ago" },
      { text: "Attendance export generated", time: "1 week ago" },
    ],
    []
  );

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
    if (r.role === "Super Admin") {
      showToast("Super Admin accounts cannot be deleted.", "danger");
      return;
    }
    setPendingDelete(r);
    setDeleteOpen(true);
  };

  const deleteYes = () => {
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
    <div className="app-shell dash mam-shell">
      <Sidebar open={false} active="manage-admin" />

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
            <div>
              <div className="dash-title">Admin Management</div>
              <div className="dash-subtitle">Manage administrator accounts</div>
            </div>
          </div>

          <div className="dash-topbar-right">
            <button
              className="icon-btn"
              aria-label="Notifications"
              type="button"
              ref={notifRef}
              onClick={() => {
                setActivityAnchorRect(notifRef.current?.getBoundingClientRect() ?? null);
                setActivityOpen(true);
              }}
            >
              <span className="notif-dot" />
              <FontAwesomeIcon icon={faBell} />
            </button>

            {/* topbar logout removed */}
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
                {pageRows.map((r) => {
                  const superAdmin = r.role === "Super Admin";
                  return (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.fullName}</td>
                      <td>{r.username}</td>
                      <td>{r.role}</td>
                      <td>
                        <span className={`mam-status ${r.status === "Active" ? "active" : "inactive"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="mam-actionsCell">
                        <button className="mam-action edit" onClick={() => onEdit(r)} type="button">
                          ✎ Edit
                        </button>

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

      {/* Activity Modal (Bell) */}
      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        items={activity}
        anchorRect={activityAnchorRect}
      />
    </div>
  );
}
