import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./ProfessorManagement.css";
import AddProfessorModal from "../components/AddProfessorModal";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditProfessorModal from "../components/EditProfessorModal";
import supabase from "../helper/supabaseClient";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faMagnifyingGlass,
  faPlus,
  faDownload,
  faPenToSquare,
  faTrash,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export default function ProfessorManagement() {
  const navigate = useNavigate();
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);
  const notifRef = useRef(null);

  // Search + pagination
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);

  // ===== Activity (Bell) =====
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

  

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]); // ✅ start empty, DB will fill

  const fetchProfessors = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("professors")
      .select("id, professor_name, email, department, status")
      .order("professor_name", { ascending: true });

    if (error) {
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(
      (data || []).map((p) => ({
        id: p.id,
        name: p.professor_name,
        email: p.email,
        classes: 0,
        status: p.status ?? "Active",
        department: p.department,
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  // ===== Add + Confirm =====
  const [addOpen, setAddOpen] = useState(false);
  
  // ✅ success modal state
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  function SuccessModal({ open, message, onClose }) {
    useEffect(() => {
      if (!open) return;
      const t = setTimeout(() => onClose?.(), 1500);
      return () => clearTimeout(t);
    }, [open, onClose]);

    if (!open) return null;

    return (
      <div className="scm-overlay" onMouseDown={onClose}>
        <div className="scm-card" onMouseDown={(e) => e.stopPropagation()}>
          <i className="bx bx-check-circle"></i>
          <p className="scm-text">{message}</p>
        </div>
      </div>
    );
  }

  const onAdd = () => setAddOpen(true);

  const handleAddSubmit = async () => {
    setAddOpen(false);
    setSuccessMsg("Professor added successfully!");
    setSuccessOpen(true);

    await fetchProfessors();
  };

  const [actionLoading, setActionLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);  
  const [pendingEdit, setPendingEdit] = useState(null);

  // ===== Edit (DB) + Confirm =====
  const [editOpen, setEditOpen] = useState(false);
  const [editingProf, setEditingProf] = useState(null);

  const onEdit = (profObj) => {
    setEditingProf(profObj);
    setEditOpen(true);
  };

  // called by EditProfessorModal when user clicks save
  const onEditSaveClick = (updatedProf) => {
    setPendingEdit(updatedProf);   // store changes
    setApplyOpen(true);           // open confirm
  };

  const applyYes = async () => {
    if (!pendingEdit?.id) {
      setApplyOpen(false);
      setPendingEdit(null);
      return;
    }

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
      setPendingEdit(null);
      setEditingProf(null);
      setEditOpen(false);           // close edit modal
      
      setSuccessMsg("Professor updated successfully!");
      setSuccessOpen(true);

      await fetchProfessors();
    } catch (err) {
      setApplyOpen(false);
      setPendingEdit(null);
      setEditingProf(null);
    } finally {
      setActionLoading(false);
    }
  };

  const applyCancel = () => {
    if (actionLoading) return;
    setApplyOpen(false);
    setPendingEdit(null);
    setEditingProf(null);
  };


  // ===== Delete (DB) Confirm =====
  const onDeleteClick = (profObj) => {
    setPendingDelete(profObj);
    setDeleteOpen(true);
  };

  const deleteYes = async () => {
    if (!pendingDelete?.id) {
      setPendingDelete(null);
      return;
    }

    setActionLoading(true);

    try {
      const { error } = await supabase.rpc("admin_delete_user", {
        p_user_id: pendingDelete.id, // auth.users.id
      });
      if (error) throw error;

      setDeleteOpen(false);
      setPendingDelete(null);

      setSuccessMsg("Professor deleted successfully!");
      setSuccessOpen(true);

      await fetchProfessors();
    } catch (err) {
      setDeleteOpen(false);
      setPendingDelete(null);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCancel = () => {
    if (actionLoading) return;
    setDeleteOpen(false);
    setPendingDelete(null);
  };


  // ===== Filtering =====
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((p) => p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query));
  }, [rows, q]);

  // reset page when filters/entries change
  useEffect(() => {
    setPage(1);
  }, [q, entries]);

  // ===== Pagination =====
  const totalPages = Math.max(1, Math.ceil(filtered.length / entries));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * entries;
    return filtered.slice(start, start + entries);
  }, [filtered, safePage, entries]);

  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * entries + 1;
  const showingTo = Math.min(filtered.length, (safePage - 1) * entries + paged.length);

  // ===== Stats =====
  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((p) => p.status === "Active").length;
    const inactive = rows.filter((p) => p.status === "Inactive").length;
    return { total, active, inactive };
  }, [rows]);

  const exportCSV = () => {
    const header = ["Professor Name", "Email", "Classes", "Status"];
    const dataRows = filtered.map((p) => [p.name, p.email, p.classes, p.status]);
    const csv = [header, ...dataRows].map((r) => r.map(csvEscape).join(",")).join("\n");

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

  return (
    <div className="app-shell pm">
      <Sidebar open={false} active="dashboard" />

      {/* Topbar */}
      <header className="pm-topbar">
        <div className="pm-topbar-inner">
          <div className="pm-topbar-left">
            <div>
              <div className="pm-title">Professor Management</div>
              <div className="pm-subtitle">Review list of professors</div>
            </div>
          </div>

          <div className="pm-topbar-right">
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

      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        items={activity}
        anchorRect={activityAnchorRect}
      />

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

        {/* TABLE CARD */}
        <section className="pm-card">
          <div className="pm-controls">
            <div className="pm-controls-left">
              <span className="pm-controlLabel">Show</span>

              <div className="pm-searchBox">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
                <span className="pm-searchIcon">
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </span>
              </div>

              <div className="pm-entriesInline">
                <span className="pm-entriesLabel">Show</span>
                <select value={entries} onChange={(e) => setEntries(Number(e.target.value))}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <span className="pm-entriesLabel">entries</span>
              </div>
            </div>

            <div className="pm-controls-right">
              <button className="pm-addBtn" type="button" onClick={onAdd} aria-label="Add">
                <FontAwesomeIcon icon={faPlus} />
              </button>

              <button className="pm-exportBtn" type="button" onClick={exportCSV}>
                <span className="pm-exportIcon">
                  <FontAwesomeIcon icon={faDownload} />
                </span>
                Export CSV
              </button>
            </div>
          </div>

          <div className="pm-tableWrap">
            <table className="pm-tableReal">
              <thead>
                <tr>
                  <th>Professor Name</th>
                  <th>Email</th>
                  <th>Classes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="5" className="pm-emptyCell">
                      Loading professors...
                    </td>
                  </tr>
                )}

                {!loading && paged.length === 0 && (
                  <tr>
                    <td colSpan="5" className="pm-emptyCell">
                      No professors found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  paged.map((p) => (
                    <tr key={p.id || p.email}>
                      <td>
                        <div className="pm-nameCell">
                          <span className="pm-avatar">{initials(p.name)}</span>
                          <span>{p.name}</span>
                        </div>
                      </td>

                      <td className="pm-email">{p.email}</td>

                      <td>{p.classes}</td>

                      <td>
                        <span className={`pm-pill ${p.status === "Active" ? "active" : "inactive"}`}>
                          {p.status}
                        </span>
                      </td>

                      <td>
                        <div className="pm-actionCell">
                          <button className="pm-actionBtn edit" onClick={() => onEdit(p)} type="button">
                            <FontAwesomeIcon icon={faPenToSquare} /> Edit
                          </button>

                          <button className="pm-actionBtn del" onClick={() => onDeleteClick(p)} type="button">
                            <FontAwesomeIcon icon={faTrash} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="pm-footer">
              <div className="pm-footerLeft">
                Showing {showingFrom} to {showingTo} of {filtered.length} entries
              </div>

              <div className="pm-footerRight">
                <button
                  className="pm-pageBtn"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  <FontAwesomeIcon icon={faChevronLeft} /> Previous
                </button>

                <button className="pm-pageNum active" type="button">
                  {safePage}
                </button>

                <button
                  className="pm-pageBtn"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  type="button"
                >
                  Next <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* Add Professor Modal */}
      <AddProfessorModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddSubmit} />

      {/* Edit Professor Modal */}
      <EditProfessorModal
        open={editOpen}
        professor={editingProf}
        onClose={() => setEditOpen(false)}
        onSaveClick={onEditSaveClick}
      />

      <SuccessModal
        open={successOpen}
        message={successMsg}
        onClose={() => setSuccessOpen(false)}
      />

      {/* Confirm Apply Edit */}
      <SmallConfirmModal
        open={applyOpen}
        title={actionLoading ? "Applying changes..." : "Apply Changes?"}
        onYes={applyYes}
        onCancel={applyCancel}
      />

      {/* Confirm Delete */}
      <SmallConfirmModal
        open={deleteOpen}
        title={
          actionLoading
            ? "Deleting..."
            : `Delete ${pendingDelete?.name || "this professor"}?`
        }
        onYes={deleteYes}
        onCancel={deleteCancel}
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