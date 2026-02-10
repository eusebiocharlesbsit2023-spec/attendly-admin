import React, { useMemo, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./StudentManagement.css";
import AddStudentModal from "../components/AddStudentModal";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditStudentModal from "../components/EditStudentModal";
import supabase from "../helper/supabaseClient";

/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

/* ===== Font Awesome ===== */
import { 
  FontAwesomeIcon 
} from "@fortawesome/react-fontawesome";
import { 
  faBell, 
  faMagnifyingGlass, 
  faPlus, 
  faDownload, 
  faPenToSquare, 
  faArchive,
  faChevronLeft,
  faChevronRight 
} from "@fortawesome/free-solid-svg-icons";

export default function StudentManagement() {
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

  // ===== Filters =====
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);

  // ===== Modals/Status States =====
  const [addOpen, setAddOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [pendingEdit, setPendingEdit] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ===== Data States =====
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select(`
        id,
        first_name,
        last_name,
        student_number,
        status,
        email,
        mac_address,
        class_enrollments:class_enrollments(count)
      `)
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Fetch students error:", error.message);
      setRows([]);
    } else {
      const mapped = (data || []).map((s) => ({
        uuid: s.id,
        name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.replace(/\s+/g, " ").trim(),
        email: s.email ?? "",
        studentId: (s.student_number ?? "").toString(),
        deviceId: s.mac_address ?? "N/A",
        classes: Number(s.class_enrollments?.[0]?.count ?? 0),
        status: s.status ?? "Active",
      }));
      setRows(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ===== ACTIONS =====
  const onAdd = () => setAddOpen(true);

  const handleStudentAdded = ({ studentRow, displayName, studentNumber }) => {
    fetchStudents(); // Refresh from DB to be sure
    setAddOpen(false);
    setSuccessMsg(`Student added: ${displayName} (${studentNumber})`);
    setSuccessOpen(true);
    setTimeout(() => setSuccessOpen(false), 2500);
  };

  const onEdit = (student) => {
    setEditingStudent(student);
    setEditOpen(true);
  };

  const onEditSaveClick = (updatedStudent) => {
    setPendingEdit(updatedStudent);
    setApplyOpen(true);
  };

  const applyYes = async () => {
    if (savingEdit || !pendingEdit?.uuid) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ status: pendingEdit.status })
        .eq("id", pendingEdit.uuid);

      if (error) throw error;

      setRows((prev) =>
        prev.map((s) => (s.uuid === pendingEdit.uuid ? { ...s, ...pendingEdit } : s))
      );
      setApplyOpen(false);
      setEditOpen(false);
      setSuccessMsg(`Updated student: ${pendingEdit.name}`);
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } catch (err) {
      console.error(err.message);
    } finally {
      setSavingEdit(false);
      setPendingEdit(null);
      setEditingStudent(null);
    }
  };

  const onDeleteClick = (student) => {
    setPendingDelete(student);
    setDeleteOpen(true);
  };

  const deleteYes = async () => {
    if (deleting || !pendingDelete?.uuid) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ archived: true, status: "Inactive" })
        .eq("id", pendingDelete.uuid);

      if (error) throw error;

      setRows((prev) => prev.filter((s) => s.uuid !== pendingDelete.uuid));
      setDeleteOpen(false);
      setSuccessMsg(`Student archived: ${pendingDelete.name}`);
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } catch (err) {
      console.error(err.message);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  // ===== FILTERING & PAGINATION =====
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((s) => {
      const matchesQuery = !query || s.name.toLowerCase().includes(query) || s.studentId.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All Status" || s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, q, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entries));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * entries;
    return filtered.slice(start, start + entries);
  }, [filtered, safePage, entries]);

  const showingFrom = (safePage - 1) * entries + (pageRows.length ? 1 : 0);
  const showingTo = (safePage - 1) * entries + pageRows.length;

  useEffect(() => { setPage(1); }, [q, statusFilter, entries]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((s) => s.status === "Active").length,
      inactive: rows.filter((s) => s.status === "Inactive").length,
    };
  }, [rows]);

  const exportCSV = () => {
    const header = ["Student Name", "Email", "Student Id", "Device Id", "Classes", "Status"];
    const csv = [header, ...filtered.map(s => [s.name, s.email, s.studentId, s.deviceId, s.classes, s.status])]
      .map(r => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "students.csv"; a.click();
  };

  return (
    <div className="app-shell sm">
      <Sidebar open={false} active="dashboard" />

      {/* Topbar */}
      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <div>
              <div className="mnt-title">Student Management</div>
              <div className="mnt-subtitle">Review list of students</div>
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

      <main className="sm-main">
        <section className="sm-stats">
          <div className="sm-stat sm-stat-white">
            <div className="sm-stat-label">Total Students</div>
            <div className="sm-stat-value">{stats.total}</div>
          </div>
          <div className="sm-stat sm-stat-green">
            <div className="sm-stat-label">Active</div>
            <div className="sm-stat-value">{stats.active}</div>
          </div>
          <div className="sm-stat sm-stat-red">
            <div className="sm-stat-label">Inactive</div>
            <div className="sm-stat-value">{stats.inactive}</div>
          </div>
        </section>

        <section className="sm-card">
          <div className="sm-cardTop">
            <button className="sm-addTopBtn" onClick={onAdd}>
              <FontAwesomeIcon icon={faPlus} /> Add Student
            </button>
            <button className="sm-exportTopBtn" onClick={exportCSV}>
              <FontAwesomeIcon icon={faDownload} /> Export CSV
            </button>
          </div>

          <div className="sm-filters">
            <div className="sm-filterRow">
              <div className="sm-searchBox">
                <span className="sm-searchIcon"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
              </div>
              <div className="sm-filterRight">
                <div className="sm-filterLabel">Status</div>
                <select className="sm-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option>All Status</option><option>Active</option><option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="sm-strip">
              <div className="sm-stripLeft">
                <div className="sm-stripText">Showing {showingFrom} to {showingTo} of {filtered.length} entries</div>
                <div className="sm-entries">
                  <span>Show</span>
                  <select value={entries} onChange={(e) => setEntries(Number(e.target.value))}>
                    <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option>
                  </select>
                  <span>entries</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sm-tableWrap">
            <table className="sm-table2">
              <thead>
                <tr>
                  <th>Student Name</th><th>Email</th><th>Student ID</th><th>Device ID</th><th>Classes</th><th className="sm-th-center">Status</th><th className="sm-actionsHead">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="sm-emptyRow" colSpan={7}>Loading students...</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td className="sm-emptyRow" colSpan={7}>No students found.</td></tr>
                ) : (
                  pageRows.map((s) => (
                    <tr key={s.uuid}>
                      <td className="sm-nameTd">
                        <span className="sm-avatar">{initials(s.name)}</span>
                        <span className="sm-nameText">{s.name}</span>
                      </td>
                      <td>{s.email || "—"}</td>
                      <td>{s.studentId}</td><td>{s.deviceId}</td><td>{s.classes}</td>
                      <td className="sm-td-center">
                        <span className={`sm-status ${s.status === "Active" ? "active" : "inactive"}`}>{s.status}</span>
                      </td>
                      <td className="sm-actionsCell">
                        <button className="sm-action edit" onClick={() => onEdit(s)}><FontAwesomeIcon icon={faPenToSquare} /> Edit</button>
                        <button className="sm-action del" onClick={() => onDeleteClick(s)}><FontAwesomeIcon icon={faArchive} /> Archive</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sm-footer">
            <div className="sm-footerRight">
              <button className="sm-footerBtn" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}><FontAwesomeIcon icon={faChevronLeft} /> Previous</button>
              <span className="sm-footerPage">{safePage}</span>
              <button className="sm-footerBtn" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>Next <FontAwesomeIcon icon={faChevronRight} /></button>
            </div>
          </div>
        </section>
      </main>

      <AddStudentModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleStudentAdded} />
      <EditStudentModal open={editOpen} student={editingStudent} onClose={() => setEditOpen(false)} onSaveClick={onEditSaveClick} />
      
      {successOpen && (
        <div className="scm-overlay"><div className="scm-card"><i className="bx bx-check-circle"></i><p className="scm-text">{successMsg}</p></div></div>
      )}

      <SmallConfirmModal open={applyOpen} title={savingEdit ? "Saving..." : "Apply Changes?"} onYes={applyYes} onCancel={() => setApplyOpen(false)} />
      <SmallConfirmModal open={deleteOpen} title={deleting ? "Archiving..." : `Archive ${pendingDelete?.name}?`} onYes={deleteYes} onCancel={() => setDeleteOpen(false)} />

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
