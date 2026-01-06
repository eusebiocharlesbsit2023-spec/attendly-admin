import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./StudentManagement.css";
import AddStudentModal from "../components/AddStudentModal";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditStudentModal from "../components/EditStudentModal";

export default function StudentManagement() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const [q, setQ] = useState("");

  // ===== Add Student Modal & Confirm =====
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStudent, setPendingStudent] = useState(null);

  // ===== Edit Student + Apply Changes Confirm =====
  const [editOpen, setEditOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [pendingEdit, setPendingEdit] = useState(null);

  // ✅ Delete Confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // ✅ initial students (memo)
  const initialStudents = useMemo(
    () => [
      {
        name: "John Smith",
        studentId: "20231547",
        deviceId: "AA:BB:CC:DD:EE:01",
        classes: 6,
        status: "Active",
      },
      {
        name: "Alice Willson",
        studentId: "20236485",
        deviceId: "AA:BB:CC:DD:EE:02",
        classes: 6,
        status: "Inactive",
      },
      {
        name: "Dakota Johnson",
        studentId: "20235487",
        deviceId: "AA:BB:CC:DD:EE:03",
        classes: 6,
        status: "Active",
      },
      {
        name: "Odette Lancelot",
        studentId: "20231544",
        deviceId: "AA:BB:CC:DD:EE:04",
        classes: 6,
        status: "Active",
      },
      {
        name: "Michal Winger",
        studentId: "20231154",
        deviceId: "AA:BB:CC:DD:EE:05",
        classes: 6,
        status: "Inactive",
      },
    ],
    []
  );

  const [rows, setRows] = useState(initialStudents);

  // ===== ADD FLOW =====
  const onAdd = () => setAddOpen(true);

  // from AddStudentModal -> open confirm first (no alert)
  const handleAddFormSubmit = (payload) => {
    setPendingStudent(payload);
    setAddOpen(false);
    setConfirmOpen(true);
  };

  // Confirm YES -> actually add to list (temporary/local)
  const confirmYes = () => {
    setConfirmOpen(false);

    if (pendingStudent?.name && pendingStudent?.studentId) {
      setRows((prev) => [
        {
          name: pendingStudent.name,
          studentId: pendingStudent.studentId,
          deviceId: pendingStudent.deviceId || "N/A",
          classes: Number(pendingStudent.classes ?? 0),
          status: pendingStudent.status || "Active",
        },
        ...prev,
      ]);
    }

    setPendingStudent(null);
  };

  const confirmCancel = () => {
    setConfirmOpen(false);
    setPendingStudent(null);
    // optional: reopen add modal
    // setAddOpen(true);
  };

  // ===== EDIT FLOW =====
  const onEdit = (student) => {
    setEditingStudent(student);
    setEditOpen(true);
  };

  // after Save inside edit modal -> open apply confirm
  const onEditSaveClick = (updatedStudent) => {
    setPendingEdit(updatedStudent);
    setApplyOpen(true);
  };

  // Apply YES -> update local list (temporary/local)
  const applyYes = () => {
    setApplyOpen(false);
    setEditOpen(false);

    if (pendingEdit?.studentId) {
      setRows((prev) =>
        prev.map((s) => (s.studentId === pendingEdit.studentId ? { ...s, ...pendingEdit } : s))
      );
    }

    setPendingEdit(null);
    setEditingStudent(null);
  };

  const applyCancel = () => {
    setApplyOpen(false);
    setPendingEdit(null);
    // optional: go back to edit modal
    // setEditOpen(true);
  };

  // ===== DELETE FLOW =====
  const onDeleteClick = (student) => {
    setPendingDelete(student);
    setDeleteOpen(true);
  };

  const deleteYes = () => {
    setRows((prev) => prev.filter((s) => s.studentId !== pendingDelete?.studentId));
    setDeleteOpen(false);
    setPendingDelete(null);
  };

  const deleteCancel = () => {
    setDeleteOpen(false);
    setPendingDelete(null);
  };

  // ===== FILTERING =====
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.studentId.toLowerCase().includes(query)
    );
  }, [rows, q]);

  // ===== STATS =====
  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((s) => s.status === "Active").length;
    const inactive = rows.filter((s) => s.status === "Inactive").length;
    return { total, active, inactive };
  }, [rows]);

  const exportCSV = () => {
    const header = ["Student Name", "Student Id", "Device Id", "Classes", "Status"];
    const dataRows = filtered.map((s) => [s.name, s.studentId, s.deviceId, s.classes, s.status]);
    const csv = [header, ...dataRows].map((r) => r.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {}, []);

  return (
    <div className="app-shell sm">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="dashboard" />

      {/* Topbar */}
      <header className="sm-topbar">
        <div className="sm-topbar-inner">
          <div className="sm-topbar-left">
            <button
              className="sm-icon-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
              type="button"
            >
              <Svg name="menu" />
            </button>

            <div>
              <div className="sm-title">Student Management</div>
              <div className="sm-subtitle">Review list of students</div>
            </div>
          </div>

          <div className="sm-topbar-right">
            <button className="sm-icon-btn" aria-label="Notifications" type="button">
              <span className="sm-notif-dot" />
              <Svg name="bell" />
            </button>

            <button
              className="sm-icon-btn"
              aria-label="Logout"
              type="button"
              onClick={() => navigate("/")}
            >
              <Svg name="logout" />
            </button>
          </div>
        </div>
      </header>

      <main className="sm-main">
        {/* Stats */}
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

        {/* Search + actions */}
        <section className="sm-tools card">
          <div className="sm-search">
            <span className="sm-searchIcon">
              <Svg name="search" />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or Id"
            />
          </div>

          <div className="sm-actions">
            <button className="sm-addBtn" type="button" onClick={onAdd} aria-label="Add">
              <Svg name="plus" />
            </button>

            <button className="sm-exportBtn" type="button" onClick={exportCSV}>
              <span className="sm-exportIcon">
                <Svg name="download" />
              </span>
              Export CSV
            </button>
          </div>
        </section>

        {/* Table */}
        <section className="sm-table card">
          <div className="sm-thead">
            <div>Student Name</div>
            <div>Student Id</div>
            <div>Device Id</div>
            <div>Classes</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          <div className="sm-tbody">
            {filtered.map((s, idx) => (
              <div className={`sm-row ${idx % 2 ? "alt" : ""}`} key={s.studentId}>
                <div className="sm-nameCell">
                  <span className="sm-avatar">{initials(s.name)}</span>
                  <span>{s.name}</span>
                </div>

                <div>{s.studentId}</div>
                <div className="sm-device">{s.deviceId}</div>
                <div>{s.classes}</div>

                <div>
                  <span className={`sm-pill ${s.status === "Active" ? "active" : "inactive"}`}>
                    {s.status}
                  </span>
                </div>

                <div className="sm-actionIcons">
                  <button
                    className="sm-icoBtn edit"
                    onClick={() => onEdit(s)}
                    aria-label="Edit"
                    type="button"
                  >
                    <Svg name="edit" />
                  </button>

                  <button
                    className="sm-icoBtn del"
                    onClick={() => onDeleteClick(s)}
                    aria-label="Delete"
                    type="button"
                  >
                    <Svg name="trash" />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && <div className="sm-empty">No students found.</div>}
          </div>
        </section>
      </main>

      {/* Add Student Modal */}
      <AddStudentModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddFormSubmit} />

      {/* Add confirm */}
      <SmallConfirmModal open={confirmOpen} title="Add New Student?" onYes={confirmYes} onCancel={confirmCancel} />

      {/* Edit Student Modal */}
      <EditStudentModal
        open={editOpen}
        student={editingStudent}
        onClose={() => setEditOpen(false)}
        onSaveClick={onEditSaveClick}
      />

      {/* Apply edit confirm */}
      <SmallConfirmModal open={applyOpen} title="Apply Changes?" onYes={applyYes} onCancel={applyCancel} />

      {/* Delete confirm */}
      <SmallConfirmModal
        open={deleteOpen}
        title={`Delete ${pendingDelete?.name || "this student"}?`}
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

/* Icons (no libs) */
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
    case "search":
      return (
        <svg {...common}>
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" />
          <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M6 6l1 16h10l1-16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
