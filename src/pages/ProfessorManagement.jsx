import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./ProfessorManagement.css";
import AddProfessorModal from "../components/AddProfessorModal";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditProfessorModal from "../components/EditProfessorModal";
import ActivityHistoryModal from "../components/ActivityHistoryModal";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faRightFromBracket,
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
  const [menuOpen, setMenuOpen] = useState(false);

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

  // ===== initial list -> state =====
  const initialProfessors = useMemo(
    () => [
      { name: "John Smith", email: "johnsmith@gmail.com", classes: 6, status: "Active" },
      { name: "Alice Willson", email: "alicewilson@gmail.com", classes: 6, status: "Inactive" },
      { name: "Dakota Johnson", email: "dakotajohnson@gmail.com", classes: 6, status: "Active" },
      { name: "Odette Lancelot", email: "odettelancelot@gmail.com", classes: 6, status: "Active" },
      { name: "Michal Winger", email: "michalwinger@gmail.com", classes: 6, status: "Inactive" },
    ],
    []
  );

  const [rows, setRows] = useState(initialProfessors);

  // ===== Toast =====
  const [toast, setToast] = useState({ open: false, message: "", type: "info" });
  const showToast = (message, type = "info") => setToast({ open: true, message, type });

  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, open: false })), 2500);
    return () => clearTimeout(t);
  }, [toast.open]);

  // ===== Add + Confirm =====
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingProf, setPendingProf] = useState(null);

  const onAdd = () => setAddOpen(true);

  const handleAddSubmit = (payload) => {
    setPendingProf(payload);
    setAddOpen(false);
    setConfirmOpen(true);
  };

  const confirmYes = () => {
    setConfirmOpen(false);

    if (pendingProf?.email) {
      setRows((prev) => [
        {
          name: pendingProf.name,
          email: pendingProf.email,
          classes: Number(pendingProf.classes ?? 0),
          status: pendingProf.status ?? "Active",
        },
        ...prev,
      ]);

      showToast(`Professor added: ${pendingProf.name}`, "success");
    }

    setPendingProf(null);
  };

  const confirmCancel = () => {
    setConfirmOpen(false);
    setPendingProf(null);
  };

  // ===== Edit + Apply Confirm =====
  const [editOpen, setEditOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [editingProf, setEditingProf] = useState(null);
  const [pendingEdit, setPendingEdit] = useState(null);

  const onEdit = (profObj) => {
    setEditingProf(profObj);
    setEditOpen(true);
  };

  const onEditSaveClick = (updatedProf) => {
    setPendingEdit(updatedProf);
    setEditOpen(false);
    setApplyOpen(true);
  };

  const applyYes = () => {
    setApplyOpen(false);

    if (pendingEdit?.email) {
      setRows((prev) => prev.map((p) => (p.email === pendingEdit.email ? { ...p, ...pendingEdit } : p)));
      showToast(`Changes applied: ${pendingEdit.name}`, "success");
    }

    setPendingEdit(null);
    setEditingProf(null);
  };

  const applyCancel = () => {
    setApplyOpen(false);
    setPendingEdit(null);
    setEditingProf(null);
  };

  // ===== Delete confirm =====
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const onDeleteClick = (profObj) => {
    setPendingDelete(profObj);
    setDeleteOpen(true);
  };

  const deleteYes = () => {
    const name = pendingDelete?.name;
    setRows((prev) => prev.filter((p) => p.email !== pendingDelete?.email));
    setDeleteOpen(false);
    setPendingDelete(null);
    if (name) showToast(`Deleted: ${name}`, "danger");
  };

  const deleteCancel = () => {
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

    showToast("CSV exported successfully", "info");
  };

  return (
    <div className="app-shell pm">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="dashboard" />

      {/* Toast */}
      {toast.open && (
        <div className={`pm-toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button type="button" className="pm-toast-x" onClick={() => setToast((p) => ({ ...p, open: false }))} aria-label="Close">
            ✕
          </button>
        </div>
      )}

      {/* Topbar */}
      <header className="pm-topbar">
        <div className="pm-topbar-inner">
          <div className="pm-topbar-left">
            <button className="pm-icon-btn" onClick={() => setMenuOpen(true)} aria-label="Menu" type="button">
              <FontAwesomeIcon icon={faBars} />
            </button>

            <div>
              <div className="pm-title">Professor Management</div>
              <div className="pm-subtitle">Review list of professors</div>
            </div>
          </div>

          <div className="pm-topbar-right">
            <button className="pm-icon-btn" aria-label="Notifications" type="button" onClick={() => setActivityOpen(true)}>
              <span className="pm-notif-dot" />
              <FontAwesomeIcon icon={faBell} />
            </button>

            <button className="pm-icon-btn" aria-label="Logout" type="button" onClick={() => navigate("/")}>
              <FontAwesomeIcon icon={faRightFromBracket} />
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

        {/* TABLE CARD (Admin-layout style) */}
        <section className="pm-card">
          {/* Controls Row (like screenshot) */}
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

          {/* Table */}
          <div className="pm-table">
            <div className="pm-thead">
              <div>Professor Name</div>
              <div>Email</div>
              <div>Classes</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            <div className="pm-tbody">
              {paged.map((p) => (
                <div className="pm-row" key={p.email}>
                  <div className="pm-nameCell">
                    <span className="pm-avatar">{initials(p.name)}</span>
                    <span>{p.name}</span>
                  </div>

                  <div className="pm-email">{p.email}</div>
                  <div>{p.classes}</div>

                  <div className="pm-statusCell">
                    <span className={`pm-pill ${p.status === "Active" ? "active" : "inactive"}`}>{p.status}</span>
                  </div>

                  <div className="pm-actionCell">
                    <button className="pm-actionBtn edit" onClick={() => onEdit(p)} type="button">
                      <FontAwesomeIcon icon={faPenToSquare} />
                      Edit
                    </button>

                    <button className="pm-actionBtn del" onClick={() => onDeleteClick(p)} type="button">
                      <FontAwesomeIcon icon={faTrash} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {paged.length === 0 && <div className="pm-empty">No professors found.</div>}
            </div>

            {/* Footer (like screenshot) */}
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

      {/* Confirm Add */}
      <SmallConfirmModal open={confirmOpen} title="Add New Professor?" onYes={confirmYes} onCancel={confirmCancel} />

      {/* Edit Professor Modal */}
      <EditProfessorModal open={editOpen} professor={editingProf} onClose={() => setEditOpen(false)} onSaveClick={onEditSaveClick} />

      {/* Confirm Apply Edit */}
      <SmallConfirmModal open={applyOpen} title="Apply Changes?" onYes={applyYes} onCancel={applyCancel} />

      {/* Confirm Delete */}
      <SmallConfirmModal open={deleteOpen} title={`Delete ${pendingDelete?.name || "this professor"}?`} onYes={deleteYes} onCancel={deleteCancel} />

      {/* Activity Modal (Bell) */}
      <ActivityHistoryModal open={activityOpen} onClose={() => setActivityOpen(false)} items={activity} />
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
