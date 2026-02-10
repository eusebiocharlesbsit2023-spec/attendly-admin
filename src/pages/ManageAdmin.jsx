import React, { useMemo, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./ManageAdmin.css";
import "./AdminDashboard.css";

import CreateAdminModal from "../components/CreateAdminModal";
import SmallConfirmModal from "../components/SmallConfirmModal";

/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

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
        <div className="esm-row">
          <div className="esm-label">Role:</div>
          <div className="esm-statusWrap">
            <select className="esm-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Admin</option>
              <option>Super Admin</option>
            </select>
          </div>
        </div>
        <div className="esm-row">
          <div className="esm-label">Status:</div>
          <div className="esm-statusWrap">
            <select className="esm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value={'Active'}>Activate</option>
              <option value={'Inactive'}>Deactivate</option>
            </select>
          </div>
        </div>
        <button
          className={`esm-save ${!changed ? "disabled" : ""}`}
          type="button"
          disabled={!changed}
          onClick={() => onSaveClick({ id: admin?.id, role, status })}
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
        <i className='bx bx-check-circle'></i>
        <p className="scm-text">{message}</p>
      </div>
    </div>
  );
}

export default function ManageAdmin() {
  /* ✅ USE THE REUSABLE HOOK */
  const {
    realActivity,
    unreadCount,
    activityOpen,
    setActivityOpen,
    activityAnchorRect,
    notifRef,
    openNotif,
    refreshUnreadCount,
  } = useNotifications();

  // Filters & State
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All Roles");
  const [status, setStatus] = useState("All Status");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [rows, setRows] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!successOpen) return;
    const t = setTimeout(() => setSuccessOpen(false), 1500);
    return () => clearTimeout(t);
  }, [successOpen]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("id, admin_name, username, role, status, archived")
        .eq("archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((p, i) => ({
        id: `ADM${i + 1}`,
        fullName: p.admin_name ?? "",
        username: p.username ?? "",
        role: p.role ?? "Admin",
        status: p.status ?? "Active",
        uuid: p.id,
      }));
      setRows(mapped);
    } catch (err) {
      console.error("Fetch admins error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false); 
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [savingApply, setSavingApply] = useState(false);

  const onCreate = () => setCreateOpen(true);
  const handleCreate = () => { fetchAdmins(); setCreateOpen(false); };

  const onEdit = (r) => { setEditingRow(r); setEditRoleOpen(true); };
  const onEditSaveClick = (payload) => {
    setPendingRoleChange(payload);
    setEditRoleOpen(false);
    setApplyOpen(true);
  };

  const applyYes = async () => {
    if (savingApply) return;
    const { id, role: newRole, status: newStatus } = pendingRoleChange || {};
    const target = rows.find((x) => x.id === id);
    if (!target?.uuid) return;

    setSavingApply(true);
    try {
      const { error } = await supabase.from("admins").update({ role: newRole, status: newStatus }).eq("id", target.uuid);
      if (error) throw error;
      setRows(prev => prev.map(x => x.id === id ? { ...x, role: newRole, status: newStatus } : x));
      setSuccessMsg(`Updated: ${id}`);
      setSuccessOpen(true);
    } catch (err) { console.error(err); } 
    finally { setSavingApply(false); setApplyOpen(false); }
  };

  const onArchive = (r) => {
    if (r.role === "Super Admin") return;
    setPendingDelete(r);
    setDeleteOpen(true);
  };

  const archiveYes = async () => {
    if (deleting || !pendingDelete?.uuid) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("admins")
        .update({ archived: true, status: "Inactive", archived_at: new Date().toISOString() })
        .eq("id", pendingDelete.uuid);
      if (error) throw error;
      setRows(prev => prev.filter(x => x.uuid !== pendingDelete.uuid));
      setSuccessMsg(`Archived admin: ${pendingDelete.id}`);
      setSuccessOpen(true);
    } catch (err) { console.error(err); }
    finally { setDeleting(false); setDeleteOpen(false); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = !q || r.id.toLowerCase().includes(q) || r.fullName.toLowerCase().includes(q) || r.username.toLowerCase().includes(q);
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

      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <div>
              <div className="dash-title">Admin Management</div>
              <div className="dash-subtitle">Manage administrator accounts</div>
            </div>
          </div>
          <div className="mnt-topbar-right">
            {/* ✅ REUSABLE BELL ICON LOGIC */}
            <button className="mnt-icon-btn" ref={notifRef} onClick={openNotif}>
              {unreadCount > 0 && <span className="mnt-notif-dot" />}
              <FontAwesomeIcon icon={faBell} />
            </button>
          </div>
        </div>
      </header>

      <main className="dash-main mam-main">
        <div className="mam-card">
          <div className="mam-cardTop">
            <button className="mam-createBtn" onClick={onCreate}>
              <span className="mam-plus">＋</span> Create New Admin
            </button>
          </div>

          <div className="mam-filters">
            <div className="mam-filter">
              <div className="mam-filterLabel">Show</div>
              <input className="mam-input" placeholder="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="mam-filter">
              <div className="mam-filterLabel">All Roles</div>
              <select className="mam-select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
                <option>All Roles</option><option>Admin</option><option>Super Admin</option>
              </select>
            </div>
            <div className="mam-filter">
              <div className="mam-filterLabel">Status</div>
              <select className="mam-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option>All Status</option><option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="mam-strip">
            <div className="mam-entries">
              <span>Show</span>
              <select value={entries} onChange={(e) => { setEntries(Number(e.target.value)); setPage(1); }}>
                <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option>
              </select>
              <span>entries</span>
            </div>
            <div className="mam-miniPager">
              <button className="mam-miniBtn" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              <span className="mam-miniPage">{safePage}</span>
              <button className="mam-miniBtn" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <span className="mam-miniNext">Next ›</span>
            </div>
          </div>

          <div className="mam-tableWrap">
            <table className="mam-table">
              <thead>
                <tr>
                  <th>Admin ID</th><th>Full Name</th><th>Username</th><th>Role</th><th>Status</th><th className="mam-actionsHead">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="mam-empty" colSpan={6}>Loading admins...</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td className="mam-empty" colSpan={6}>No records found.</td></tr>
                ) : (
                  pageRows.map((r) => (
                    <tr key={r.uuid}>
                      <td>{r.id}</td><td>{r.fullName}</td><td>{r.username}</td><td>{r.role}</td>
                      <td><span className={`mam-status ${r.status === "Active" ? "active" : "inactive"}`}>{r.status}</span></td>
                      <td className="mam-actionsCell">
                        <button className="mam-action edit" onClick={() => onEdit(r)}>✎ Edit</button>
                        <button
                          className={`mam-action del ${r.role === "Super Admin" ? "disabled" : ""}`}
                          onClick={() => onArchive(r)}
                          disabled={r.role === "Super Admin" || deleting}
                        >
                          {deleting && pendingDelete?.uuid === r.uuid ? "Archiving..." : "🗑 Archive"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mam-footer">
            <div className="mam-footerLeft">Showing {showingFrom} to {showingTo} of {filtered.length} entries</div>
            <div className="mam-footerRight">
              <button className="mam-footerBtn" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>‹ Previous</button>
              <span className="mam-footerPage">{safePage}</span>
              <button className="mam-footerBtn" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>Next ›</button>
            </div>
          </div>
        </div>
      </main>

      <CreateAdminModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <EditAdminRoleModal open={editRoleOpen} admin={editingRow} onClose={() => setEditRoleOpen(false)} onSaveClick={onEditSaveClick} />
      <SmallConfirmModal open={applyOpen} title={savingApply ? "Saving..." : `Apply role change?`} onYes={applyYes} onCancel={() => setApplyOpen(false)} />
      <SuccessModal open={successOpen} message={successMsg} onClose={() => setSuccessOpen(false)} />
      <SmallConfirmModal open={deleteOpen} title={deleting ? "Archiving..." : `Archive Admin?`} onYes={archiveYes} onCancel={() => setDeleteOpen(false)} />

      {/* ✅ REUSABLE MODAL WITH REALTIME DATA */}
      <ActivityHistoryModal 
        open={activityOpen} 
        onClose={() => { setActivityOpen(false); refreshUnreadCount(); }} 
        items={realActivity} 
        anchorRect={activityAnchorRect} 
      />
    </div>
  );
}
