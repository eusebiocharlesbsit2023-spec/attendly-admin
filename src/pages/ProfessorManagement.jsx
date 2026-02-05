import React, { useMemo, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./ProfessorManagement.css";
import AddProfessorModal from "../components/AddProfessorModal";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditProfessorModal from "../components/EditProfessorModal";
import supabase from "../helper/supabaseClient";

/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faMagnifyingGlass,
  faPlus,
  faDownload,
  faPenToSquare,
  faChevronLeft,
  faChevronRight,
  faArchive,
} from "@fortawesome/free-solid-svg-icons";

export default function ProfessorManagement() {
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

  // Search + pagination states
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);

  // Data states
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]); 

  const fetchProfessors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("professors")
        .select(`
          id,
          professor_name,
          email,
          department,
          status,
          archived,
          classes:classes(count)
        `)
        .eq("archived", false) 
        .order("professor_name", { ascending: true });

      if (error) throw error;

      setRows(
        (data || []).map((p) => ({
          id: p.id,
          name: p.professor_name,
          email: p.email,
          department: p.department,
          status: p.status ?? "Active",
          classes: Number(p.classes?.[0]?.count ?? 0),
        }))
      );
    } catch (err) {
      console.error("fetchProfessors error:", err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  // Modals / Action states
  const [addOpen, setAddOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);  
  const [pendingEdit, setPendingEdit] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProf, setEditingProf] = useState(null);

  // Success Modal Component
  function SuccessModal({ open, message, onClose }) {
    useEffect(() => {
      if (!open) return;
      const t = setTimeout(() => onClose?.(), 1500);
      return () => clearTimeout(t);
    }, [open, onClose]);

    if (!open) return null;
    return (
      <div className="scm-overlay">
        <div className="scm-card">
          <i className="bx bx-check-circle"></i>
          <p className="scm-text">{message}</p>
        </div>
      </div>
    );
  }

  // Handlers
  const onAdd = () => setAddOpen(true);
  const handleAddSubmit = async () => {
    setAddOpen(false);
    setSuccessMsg("Professor added successfully!");
    setSuccessOpen(true);
    await fetchProfessors();
  };

  const onEdit = (profObj) => {
    setEditingProf(profObj);
    setEditOpen(true);
  };

  const onEditSaveClick = (updatedProf) => {
    setPendingEdit(updatedProf);
    setApplyOpen(true);
  };

  const applyYes = async () => {
    if (!pendingEdit?.id) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("professors")
        .update({
          professor_name: pendingEdit.name,
          email: pendingEdit.email,
          department: pendingEdit.department,
          status: pendingEdit.status,
        })
        .eq("id", pendingEdit.id);

      if (error) throw error;

      setApplyOpen(false);
      setEditOpen(false);
      setSuccessMsg("Professor updated successfully!");
      setSuccessOpen(true);
      await fetchProfessors();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const onArchiveClick = (profObj) => {
    setPendingDelete(profObj);
    setDeleteOpen(true);
  };

  const archiveYes = async () => {
    if (!pendingDelete?.id) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("professors")
        .update({ archived: true })
        .eq("id", pendingDelete.id);

      if (error) throw error;

      setDeleteOpen(false);
      setSuccessMsg("Professor archived successfully!");
      setSuccessOpen(true);
      await fetchProfessors();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Logic: Filtering & Pagination
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((p) => p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query));
  }, [rows, q]);

  useEffect(() => { setPage(1); }, [q, entries]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entries));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * entries;
    return filtered.slice(start, start + entries);
  }, [filtered, safePage, entries]);

  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * entries + 1;
  const showingTo = Math.min(filtered.length, (safePage - 1) * entries + paged.length);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((p) => p.status === "Active").length,
      inactive: rows.filter((p) => p.status === "Inactive").length,
    };
  }, [rows]);

  const exportCSV = () => {
    const header = ["Professor Name", "Email", "Classes", "Status"];
    const csv = [header, ...filtered.map(p => [p.name, p.email, p.classes, p.status])]
      .map(r => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "professors.csv"; a.click();
  };

  return (
    <div className="app-shell pm">
      <Sidebar open={false} active="dashboard" />

      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="pm-topbar-left">
            <div>
              <div className="pm-title">Professor Management</div>
              <div className="pm-subtitle">Review list of professors</div>
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

      <main className="pm-main">
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

        <section className="pm-card">
          <div className="pm-controls">
            <div className="pm-controls-left">
              <div className="pm-searchBox">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
                <span className="pm-searchIcon"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
              </div>
              <div className="pm-entriesInline">
                <span className="pm-entriesLabel">Show</span>
                <select value={entries} onChange={(e) => setEntries(Number(e.target.value))}>
                  <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option>
                </select>
                <span className="pm-entriesLabel">entries</span>
              </div>
            </div>
            <div className="pm-controls-right">
              <button className="pm-addBtn" onClick={onAdd}><FontAwesomeIcon icon={faPlus} /> Add Professor</button>
              <button className="pm-exportBtn" onClick={exportCSV}><FontAwesomeIcon icon={faDownload} /> Export CSV</button>
            </div>
          </div>

          <div className="pm-tableWrap">
            <table className="pm-tableReal">
              <thead>
                <tr>
                  <th>Professor Name</th><th>Email</th><th>Classes</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="pm-emptyCell">Loading professors...</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan="5" className="pm-emptyCell">No professors found.</td></tr>
                ) : (
                  paged.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="pm-nameCell">
                          <span className="pm-avatar">{initials(p.name)}</span>
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="pm-email">{p.email}</td>
                      <td>{p.classes}</td>
                      <td><span className={`pm-pill ${p.status === "Active" ? "active" : "inactive"}`}>{p.status}</span></td>
                      <td>
                        <div className="pm-actionCell">
                          <button className="pm-actionBtn edit" onClick={() => onEdit(p)}><FontAwesomeIcon icon={faPenToSquare} /> Edit</button>
                          <button className="pm-actionBtn del" onClick={() => onArchiveClick(p)}><FontAwesomeIcon icon={faArchive} /> Archive</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="pm-footer">
              <div className="pm-footerLeft">Showing {showingFrom} to {showingTo} of {filtered.length} entries</div>
              <div className="pm-footerRight">
                <button className="pm-pageBtn" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}><FontAwesomeIcon icon={faChevronLeft} /> Previous</button>
                <button className="pm-pageNum active">{safePage}</button>
                <button className="pm-pageBtn" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>Next <FontAwesomeIcon icon={faChevronRight} /></button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AddProfessorModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddSubmit} />
      <EditProfessorModal open={editOpen} professor={editingProf} onClose={() => setEditOpen(false)} onSaveClick={onEditSaveClick} />
      <SuccessModal open={successOpen} message={successMsg} onClose={() => setSuccessOpen(false)} />
      <SmallConfirmModal open={applyOpen} title={actionLoading ? "Applying..." : "Apply Changes?"} onYes={applyYes} onCancel={() => setApplyOpen(false)} />
      <SmallConfirmModal open={deleteOpen} title={actionLoading ? "Archiving..." : `Archive ${pendingDelete?.name}?`} onYes={archiveYes} onCancel={() => setDeleteOpen(false)} />

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

function initials(name) {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "U";
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}