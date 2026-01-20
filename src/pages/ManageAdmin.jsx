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
import supabase from "../helper/supabaseClient";

/* =========================
   Role-only Edit Modal
========================= */
function EditAdminRoleModal({ open, admin, onClose, onSaveClick }) {
  const [role, setRole] = useState(admin?.role || "Admin");
  const [status, setStatus] = useState(admin?.status || "Active");

  useEffect(() => {
    setRole(admin?.role || "Admin");
    setStatus(admin?.status || "Active");
  }, [admin, open]);

  if (!open) return null;

  const originalRole = admin?.role || "Admin";
  const originalStatus = admin?.status || "Active";

  const changed = role !== originalRole || status !== originalStatus;

  return (
    <div className="esm-overlay" onClick={onClose}>
      <div className="esm-card" onClick={(e) => e.stopPropagation()}>
        <div className="esm-row">
          <div className="esm-label label">Admin ID:</div>
          <div className="esm-value">{admin?.id}</div>
        </div>

        <div className="esm-row">
          <div className="esm-label">Full Name:</div>
          <div className="esm-value">{admin?.fullName}</div>
        </div>

        <div className="esm-row">
          <div className="esm-label">Username:</div>
          <div className="esm-value">{admin?.username}</div>
        </div>

        {/* Role */}
        <div className="esm-row">
          <div className="esm-label">Role:</div>
          <div className="esm-statusWrap">
            <select
              className="esm-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option>Admin</option>
              <option>Super Admin</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div className="esm-row">
          <div className="esm-label">Status:</div>
          <div className="esm-statusWrap">
            <select
              className="esm-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value={'Active'}>Activate</option>
              <option value={'Inactive'}>Deactivate</option>
            </select>
          </div>
        </div>

        <button
          className={`esm-save ${!changed ? "disabled" : ""}`}
          type="button"
          disabled={!changed}
          title={!changed ? "Change role or status first" : "Save changes"}
          onClick={() =>
            onSaveClick({
              id: admin?.id,
              role,
              status,
            })
          }
        >
          Save
        </button>
      </div>
    </div>
  );
}

function SuccessModal({ open, message, onClose }) {
  if (!open) return null;

  return (
    <div className="scm-overlay" onClick={onClose}>
      <div className="scm-card" onClick={(e) => e.stopPropagation()}>
        <i class='bx bx-check-circle'></i>
        <p className="scm-text">{message}</p>
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
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!successOpen) return;
    const t = setTimeout(() => setSuccessOpen(false), 1500);
    return () => clearTimeout(t);
  }, [successOpen]);

  const [rows, setRows] = useState([]); // start empty
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);

      try {
        // DEBUG: check who is currently logged in
        const { data: auth } = await supabase.auth.getUser();
        console.log("CURRENT USER:", auth?.user?.email, auth?.user?.id);

        const { data, error } = await supabase
          .from("admins")
          .select("id, admin_name, username, role, status") // adjust fields to match your table
          .order("created_at", { ascending: false }); // optional if you have created_at

        if (error) {
          console.log("Fetch admins error:", error.message);
          return;
        }

        const mapped = (data || []).map((p, i) => ({
          id: `ADM${i + 1}`,
          fullName: p.admin_name ?? "",
          username: p.username ?? "",
          role: p.role ?? "Admin",
          status: p.status ?? "Active",
          uuid: p.id,
        }));

        setRows(mapped);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);


  // ===== Create Modal =====
  const [createOpen, setCreateOpen] = useState(false);

  const onCreate = () => setCreateOpen(true);

  const handleCreate = (payload) => {
    const newRow = {
      id: `ADM${rows.length + 1}`,
      fullName: payload.fullName,
      username: payload.username,
      role: payload.role,
      status: payload.status ?? "Active",
      uuid: payload.uuid, // ✅
    };
    setRows((prev) => [newRow, ...prev]);
    setCreateOpen(false);
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

  const applyYes = async () => {
    if (savingApply) return;

    const { id, role: newRole, status: newStatus } = pendingRoleChange || {};
    const target = rows.find((x) => x.id === id);

    if (!target?.uuid) {
      setApplyOpen(false);
      setPendingRoleChange(null);
      return;
    }

    setSavingApply(true);

    try {
      const { error } = await supabase
        .from("admins")
        .update({ role: newRole, status: newStatus })
        .eq("id", target.uuid);

      if (error) {
        console.log("Update role error:", error);
        return;
      }

      setRows((prev) =>
        prev.map((x) => (x.id === id ? { ...x, role: newRole, status: newStatus } : x))
      );

      setSuccessMsg(`Updated: ${id} → ${newRole}, ${newStatus}`);
      setSuccessOpen(true);
    } finally {
      setSavingApply(false);
      setApplyOpen(false);
      setPendingRoleChange(null);
      setEditingRow(null);
    }
  };

  const applyCancel = () => {
    if (savingApply) return;
    setApplyOpen(false);
    setPendingRoleChange(null);
  };

  // ===== Delete confirm =====
  const [deleteOpen, setDeleteOpen] = useState(false); 
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [savingApply, setSavingApply] = useState(false);


  const onDelete = (r) => {
    if (r.role === "Super Admin") {
      return;
    }
    setPendingDelete(r);
    setDeleteOpen(true);
  };

  const deleteYes = async () => {
    if (deleting) return;

    if (!pendingDelete?.uuid) {
      setDeleteOpen(false);
      setPendingDelete(null);
      return;
    }

    if (pendingDelete?.role === "Super Admin") {
      setDeleteOpen(false);
      setPendingDelete(null);
      return;
    }

    setDeleting(true);

    try {
      // delete from AUTH (will cascade to admins if FK is set)
      const { error } = await supabase.rpc("admin_delete_user", {
        p_user_id: pendingDelete.uuid,
      });

      if (error) {
        console.log("Auth delete error:", error);
        return;
      }

      // update UI
      setRows((prev) => prev.filter((x) => x.uuid !== pendingDelete.uuid));

      setSuccessMsg(`Deleted admin: ${pendingDelete.id}`);
      setSuccessOpen(true);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setPendingDelete(null);
    }
  };

  const deleteCancel = () => {
    if (deleting) return;
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

      {/* Top Bar */}
      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <div>
              <div className="dash-title">Admin Management</div>
              <div className="dash-subtitle">Manage administrator accounts</div>
            </div>
          </div>

          <div className="mnt-topbar-right">
            <button
              className="mnt-icon-btn"
              aria-label="Notifications"
              type="button"
              ref={notifRef}
              onClick={() => {
                setActivityAnchorRect(notifRef.current?.getBoundingClientRect() ?? null);
                setActivityOpen(true);
              }}
            >
              <span className="mnt-notif-dot" />
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
                {loading ? (
                  <tr>
                    <td className="mam-empty" colSpan={6}>
                      Loading admins...
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td className="mam-empty" colSpan={6}>
                      No records found.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => {
                    const superAdmin = r.role === "Super Admin";
                    return (
                      <tr key={r.uuid ?? r.id}>
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
                  })
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
        title={savingApply ? "Saving..." : `Apply role change for ${pendingRoleChange?.id}?`}
        onYes={applyYes}
        onCancel={applyCancel}
      />

      {/* Success change modal */}
      <SuccessModal
        open={successOpen}
        message={successMsg}
        onClose={() => setSuccessOpen(false)}
      />

      {/* Confirm delete */}
      <SmallConfirmModal
        open={deleteOpen}
        title={deleting ? "Deleting..." : `Delete ${pendingDelete?.id}?`}
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