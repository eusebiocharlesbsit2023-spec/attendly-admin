import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import AddSubjectModal from "../components/AddSubjectModal";
import EditSubjectModal from "../components/EditSubjectModal";
import SmallConfirmModal from "../components/SmallConfirmModal";
import supabase from "../helper/supabaseClient";
import "./SubjectManagement.css";

/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faPlus,
  faMagnifyingGlass,
  faDownload,
  faChevronLeft,
  faChevronRight,
  faPenToSquare,
  faArchive,
} from "@fortawesome/free-solid-svg-icons";

export default function SubjectManagement() {
  const navigate = useNavigate();

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

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [addError, setAddError] = useState("");

  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, department, course_code, course_name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubjects(data || []);
    } catch (e) {
      console.log("fetchSubjects error:", e?.message || e);
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (showAddSubject) setAddError("");
  }, [showAddSubject]);

  const deptOptions = useMemo(
    () => ["All Departments", ...Array.from(new Set(subjects.map((s) => s.department).filter(Boolean)))],
    [subjects]
  );

  const filteredSubjects = useMemo(() => {
    const query = q.trim().toLowerCase();
    const deptFiltered =
      deptFilter === "All Departments"
        ? subjects
        : subjects.filter((s) => s.department === deptFilter);

    if (!query) return deptFiltered;
    return deptFiltered.filter((s) => {
      return (
        String(s.department || "").toLowerCase().includes(query) ||
        String(s.course_code || "").toLowerCase().includes(query) ||
        String(s.course_name || "").toLowerCase().includes(query)
      );
    });
  }, [subjects, deptFilter, q]);

  useEffect(() => {
    setPage(1);
  }, [q, deptFilter, entries]);

  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / entries));
  const safePage = Math.min(page, totalPages);
  const pagedSubjects = useMemo(() => {
    const start = (safePage - 1) * entries;
    return filteredSubjects.slice(start, start + entries);
  }, [filteredSubjects, safePage, entries]);

  const showingFrom = filteredSubjects.length === 0 ? 0 : (safePage - 1) * entries + 1;
  const showingTo = Math.min(filteredSubjects.length, (safePage - 1) * entries + pagedSubjects.length);

  const onSubjectSave = async (payload) => {
    const dept = payload?.department?.trim();
    const code = payload?.courseCode?.trim();
    const name = payload?.courseName?.trim();

    if (!dept || !code || !name) {
      setAddError("All fields are required.");
      return;
    }

    try {
      setAddError("");
      const { data: exists, error: existsErr } = await supabase
        .from("subjects")
        .select("id, course_code, course_name")
        .or(`course_code.eq.${code},course_name.eq.${name}`)
        .limit(1);

      if (existsErr) throw existsErr;
      if (exists && exists.length > 0) {
        const dup = exists[0];
        if (dup.course_code === code) {
          setAddError("Course code already exists.");
        } else {
          setAddError("Course name already exists.");
        }
        return;
      }

      const { error } = await supabase.from("subjects").insert({
        department: dept,
        course_code: code,
        course_name: name,
      });
      if (error) throw error;
      await fetchSubjects();
    } catch (e) {
      console.log("Add subject failed:", e?.message || e);
      setAddError("Failed to add subject.");
      return;
    }
    setShowAddSubject(false);
  };

  const onEdit = (subject) => {
    setEditingSubject(subject);
    setEditOpen(true);
  };

  const onEditSaveClick = (updated) => {
    setPendingEdit(updated);
    setApplyOpen(true);
  };

  const applyYes = async () => {
    if (!pendingEdit?.id) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("subjects")
        .update({
          department: pendingEdit.department,
          course_code: pendingEdit.course_code,
          course_name: pendingEdit.course_name,
        })
        .eq("id", pendingEdit.id);

      if (error) throw error;

      setApplyOpen(false);
      setEditOpen(false);
      setSuccessMsg("Subject updated successfully!");
      setSuccessOpen(true);
      await fetchSubjects();
    } catch (e) {
      console.log("Update subject failed:", e?.message || e);
    } finally {
      setActionLoading(false);
      setPendingEdit(null);
      setEditingSubject(null);
    }
  };

  const onDeleteClick = (subject) => {
    setPendingDelete(subject);
    setDeleteOpen(true);
  };

  const deleteYes = async () => {
    if (!pendingDelete?.id) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", pendingDelete.id);

      if (error) throw error;

      setDeleteOpen(false);
      setSuccessMsg("Subject deleted successfully!");
      setSuccessOpen(true);
      await fetchSubjects();
    } catch (e) {
      console.log("Delete subject failed:", e?.message || e);
    } finally {
      setActionLoading(false);
      setPendingDelete(null);
    }
  };

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

  const exportCSV = () => {
    const header = ["Department", "Course Code", "Course Name"];
    const csv = [header, ...filteredSubjects.map((s) => [s.department, s.course_code, s.course_name])]
      .map((r) => r.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subjects.csv";
    a.click();
  };

  return (
    <div className="app-shell subj">
      <Sidebar open={false} active="dashboard" />

      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <button type="button" className="subj-back-btn" onClick={() => navigate(-1)} aria-label="Back" title="Back">
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <div>
              <div className="dash-title">Subject Management</div>
              <div className="dash-subtitle">Manage subjects by department</div>
            </div>
          </div>
          <div className="mnt-topbar-right">
            <button className="mnt-icon-btn" ref={notifRef} onClick={openNotif}>
              {unreadCount > 0 && <span className="mnt-notif-dot" />}
              <FontAwesomeIcon icon={faBell} />
            </button>
          </div>
        </div>
      </header>

      <main className="subj-main">
        <section className="subj-card">
          <div className="subj-controls">
            <div className="subj-controls-left">
              <div className="subj-searchBox">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
                <span className="subj-searchIcon"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
              </div>
              <div className="subj-entriesInline">
                <span className="subj-entriesLabel">Show</span>
                <select value={entries} onChange={(e) => setEntries(Number(e.target.value))}>
                  <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option>
                </select>
                <span className="subj-entriesLabel">entries</span>
              </div>
            </div>
            <div className="subj-controls-right">
              <div className="subj-filter">
                <label>Department</label>
                <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                  {deptOptions.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <button className="subj-addBtn" onClick={() => setShowAddSubject(true)}>
                <FontAwesomeIcon icon={faPlus} /> Add Subject
              </button>
              <button className="subj-exportBtn" onClick={exportCSV}>
                <FontAwesomeIcon icon={faDownload} /> Export CSV
              </button>
            </div>
          </div>

          <div className="subj-tableWrap">
            <table className="subj-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th className="subj-actionsHead">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjectsLoading ? (
                  <tr><td colSpan="4" className="subj-emptyCell">Loading subjects...</td></tr>
                ) : pagedSubjects.length === 0 ? (
                  <tr><td colSpan="4" className="subj-emptyCell">No subjects found.</td></tr>
                ) : (
                  pagedSubjects.map((s) => (
                    <tr key={s.id}>
                      <td className="subj-deptCell">{s.department}</td>
                      <td>{s.course_code}</td>
                      <td>{s.course_name}</td>
                      <td className="subj-actionsCell">
                        <button className="subj-actionBtn edit" onClick={() => onEdit(s)}>
                          <FontAwesomeIcon icon={faPenToSquare} /> Edit
                        </button>
                        <button className="subj-actionBtn del" onClick={() => onDeleteClick(s)}>
                          <FontAwesomeIcon icon={faArchive} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="subj-footer">
              <div className="subj-footerLeft">Showing {showingFrom} to {showingTo} of {filteredSubjects.length} entries</div>
              <div className="subj-footerRight">
                <button className="subj-pageBtn" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                  <FontAwesomeIcon icon={faChevronLeft} /> Previous
                </button>
                <button className="subj-pageNum active">{safePage}</button>
                <button className="subj-pageBtn" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AddSubjectModal
        open={showAddSubject}
        onClose={() => setShowAddSubject(false)}
        onSubmit={onSubjectSave}
        departments={deptOptions.filter((d) => d !== "All Departments")}
        error={addError}
      />
      <EditSubjectModal open={editOpen} subject={editingSubject} onClose={() => setEditOpen(false)} onSaveClick={onEditSaveClick} />
      <SuccessModal open={successOpen} message={successMsg} onClose={() => setSuccessOpen(false)} />
      <SmallConfirmModal open={applyOpen} title={actionLoading ? "Applying..." : "Apply Changes?"} onYes={applyYes} onCancel={() => setApplyOpen(false)} />
      <SmallConfirmModal open={deleteOpen} title={actionLoading ? "Deleting..." : `Delete ${pendingDelete?.course_code}?`} onYes={deleteYes} onCancel={() => setDeleteOpen(false)} />

      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => {
          setActivityOpen(false);
          refreshUnreadCount();
        }}
        items={realActivity}
        anchorRect={activityAnchorRect}
      />
    </div>
  );
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
