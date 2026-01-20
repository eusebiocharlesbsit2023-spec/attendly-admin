import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./StudentManagement.css";
import AddStudentModal from "../components/AddStudentModal";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditStudentModal from "../components/EditStudentModal";
import supabase from "../helper/supabaseClient";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faMagnifyingGlass, faPlus, faDownload, faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";

export default function StudentManagement() {
  const navigate = useNavigate();
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);
  const notifRef = useRef(null);

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

  // ===== Filters =====
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);

  // ===== Success Modal =====
  const [addOpen, setAddOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ===== Edit Student + Apply Changes Confirm =====
  const [editOpen, setEditOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [pendingEdit, setPendingEdit] = useState(null);

  // ✅ Delete Confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);





  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          class_enrollments:class_enrollments(count)
        `)
        .order("created_at", { ascending: false });


      if (error) {
        console.log("Fetch students error:", error.message);
        setRows([]);
        setLoading(false);
        return;
      }

      const mapped = (data || []).map((s) => ({
        uuid: s.id,
        name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.replace(/\s+/g, " ").trim(),
        studentId: (s.student_number ?? "").toString(),
        deviceId: s.device_id ?? "N/A",
        // ✅ classes enrolled
        classes: Number(s.class_enrollments?.[0]?.count ?? 0),
        status: s.status ?? "Active",
      }));

      setRows(mapped);
      setLoading(false);
    };

    fetchStudents();
  }, []);

  // ===== ADD =====
  const onAdd = () => setAddOpen(true);

  // called by AddStudentModal after successful insert
  const handleStudentAdded = ({ studentRow, displayName, studentNumber }) => {
    // insert to table immediately (top)
    setRows((prev) => [
      {
        uuid: studentRow.id,
        name: displayName,
        studentId: studentNumber,
        deviceId: studentRow.device_id ?? "N/A",
        classes: Number(studentRow.classes ?? 0),
        status: studentRow.status ?? "Active",
      },
      ...prev,
    ]);

    setSuccessMsg(`Student added: ${displayName} (${studentNumber})`);
    setSuccessOpen(true);
    setTimeout(() => setSuccessOpen(false), 2500);
  };


  // ===== EDIT =====
  const onEdit = (student) => {
    setEditingStudent(student);
    setEditOpen(true);
  };

  const onEditSaveClick = (updatedStudent) => {
    setPendingEdit(updatedStudent);
    setApplyOpen(true);
  };

  const applyYes = async () => {
    if (savingEdit) return;
    setSavingEdit(true);

    try {
      if (!pendingEdit?.uuid) {
        console.log("Missing uuid for update");
        setEditOpen(false);
        setPendingEdit(null);
        setEditingStudent(null);
        return;
      }

      const updatePayload = {
        status: pendingEdit.status,
      };

      const { error } = await supabase
        .from("students")
        .update(updatePayload)
        .eq("id", pendingEdit.uuid);

      if (error) {
        console.log("Update error:", error.message);
        return;
      }

      setRows((prev) =>
        prev.map((s) => (s.uuid === pendingEdit.uuid ? { ...s, ...pendingEdit } : s))
      );

      setApplyOpen(false);
      setEditOpen(false);
      setPendingEdit(null);
      setEditingStudent(null);

      setSuccessMsg(`Updated student: ${pendingEdit.name} (${pendingEdit.studentId})`);
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } finally {
      setSavingEdit(false);
    }
  };

  const applyCancel = () => {
    if (savingEdit) return;
    setApplyOpen(false);
    setPendingEdit(null);
  };

  // ===== DELETE =====
  const onDeleteClick = (student) => {
    setPendingDelete(student); // has uuid
    setDeleteOpen(true);
  };

  const deleteYes = async () => {
    if (deleting) return;
    if (!pendingDelete?.uuid) return;

    setDeleting(true);

    try {
      const { error } = await supabase.rpc("admin_delete_user", {
        p_user_id: pendingDelete.uuid,
      });

      if (error) {
        console.log("Auth delete error:", error.message);
        return;
      }

      // UI update (instant)
      setRows((prev) => prev.filter((s) => s.uuid !== pendingDelete.uuid));

      setDeleteOpen(false);
      setPendingDelete(null);

      setSuccessMsg(`Student deleted: ${pendingDelete.name} (${pendingDelete.studentId})`);
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } finally {
      setDeleting(false);
    }
  };

  const deleteCancel = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setPendingDelete(null);
  };

  // ===== FILTERING =====
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return rows.filter((s) => {
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.studentId.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "All Status" || s.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [rows, q, statusFilter]);

  // ===== pagination =====
  const totalPages = Math.max(1, Math.ceil(filtered.length / entries));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * entries;
    return filtered.slice(start, start + entries);
  }, [filtered, safePage, entries]);

  const showingFrom = (safePage - 1) * entries + (pageRows.length ? 1 : 0);
  const showingTo = (safePage - 1) * entries + pageRows.length;

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, entries]);

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

  return (
    <div className="app-shell sm">
      <Sidebar open={false} active="dashboard" />

      {/* Topbar */}
      <header className="sm-topbar">
        <div className="sm-topbar-inner">
          <div className="sm-topbar-left">
            <div>
              <div className="sm-title">Student Management</div>
              <div className="sm-subtitle">Review list of students</div>
            </div>
          </div>

          <div className="sm-topbar-right">
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
        items={[]}
        anchorRect={activityAnchorRect}
      />

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

        {/* One white container */}
        <section className="sm-card">
          {/* top-right buttons */}
          <div className="sm-cardTop">
            <button className="sm-addTopBtn" type="button" onClick={onAdd}>
              <FontAwesomeIcon icon={faPlus} />
              Add Student
            </button>

            <button className="sm-exportTopBtn" type="button" onClick={exportCSV}>
              <FontAwesomeIcon icon={faDownload} />
              Export CSV
            </button>
          </div>

          {/* ✅ Filter row: SEARCH FIRST, then STATUS */}
          <div className="sm-filters">
            <div className="sm-filterRow">
              <div className="sm-searchBox">
                <span className="sm-searchIcon">
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
              </div>

              <div className="sm-filterRight">
                <div className="sm-filterLabel">Status</div>
                <select
                  className="sm-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            {/* ✅ upper-left text + show entries (NO mini pager on right) */}
            <div className="sm-strip">
              <div className="sm-stripLeft">
                <div className="sm-stripText">
                  Showing {showingFrom} to {showingTo} of {filtered.length} entries
                </div>

                <div className="sm-entries">
                  <span>Show</span>
                  <select value={entries} onChange={(e) => setEntries(Number(e.target.value))}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                  </select>
                  <span>entries</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="sm-tableWrap">
            <table className="sm-table2">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Device ID</th>
                  <th>Email</th>
                  <th className="sm-th-center">Status</th>
                  <th className="sm-actionsHead">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="sm-emptyRow" colSpan={6}>
                      Loading students...
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td className="sm-emptyRow" colSpan={6}>
                      No students found.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((s) => (
                    <tr key={s.uuid ?? s.studentId}>
                      <td className="sm-nameTd">
                        <span className="sm-avatar">{initials(s.name)}</span>
                        <span className="sm-nameText">{s.name}</span>
                      </td>
                      <td>{s.studentId}</td>
                      <td className="sm-deviceTd">{s.deviceId}</td>
                      <td>{s.classes}</td>
                      <td className="sm-td-center">
                        <span className={`sm-status ${s.status === "Active" ? "active" : "inactive"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="sm-actionsCell">
                        <button className="sm-action edit" onClick={() => onEdit(s)} type="button">
                          <FontAwesomeIcon icon={faPenToSquare} />
                          Edit
                        </button>

                        <button className="sm-action del" onClick={() => onDeleteClick(s)} type="button">
                          <FontAwesomeIcon icon={faTrash} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer pagination (keep bottom like screenshot) */}
          <div className="sm-footer">
            <div className="sm-footerLeft">
              {/* keep empty or repeat info, your choice */}
            </div>

            <div className="sm-footerRight">
              <button
                className="sm-footerBtn"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                ‹ Previous
              </button>

              <span className="sm-footerPage">{safePage}</span>

              <button
                className="sm-footerBtn"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                type="button"
              >
                Next ›
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      <AddStudentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleStudentAdded}
      />

      <EditStudentModal
        open={editOpen}
        student={editingStudent}
        onClose={() => setEditOpen(false)}
        onSaveClick={onEditSaveClick}
      />

      {successOpen && (
        <div className="scm-overlay" onMouseDown={(e) => e.stopPropagation()}>
          <div className="scm-card" onMouseDown={(e) => e.stopPropagation()}>
            <i className="bx bx-check-circle"></i>
            <p className="scm-text">{successMsg}</p>
          </div>
        </div>
      )}

      <SmallConfirmModal
        open={applyOpen}
        title={savingEdit ? "Saving..." : "Apply Changes?"}
        onYes={applyYes}
        onCancel={applyCancel}
      />

      <SmallConfirmModal
        open={deleteOpen}
        title={deleting ? "Deleting..." : `Delete ${pendingDelete?.name || "this student"}?`}
        onYes={deleteYes}
        onCancel={deleteCancel}
      />

      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        items={activity}
        anchorRect={activityAnchorRect}
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
