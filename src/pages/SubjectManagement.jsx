import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import AddSubjectModal from "../components/AddSubjectModal";
import AddProgramModal from "../components/AddProgramModal";
import EditSubjectModal from "../components/EditSubjectModal";
import SmallConfirmModal from "../components/SmallConfirmModal";
import supabase from "../helper/supabaseClient";
import "./SubjectManagement.css";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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
  const [programs, setPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [viewMode, setViewMode] = useState("subjects");
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(null);
  const [pendingEditMode, setPendingEditMode] = useState("subjects");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingDeleteMode, setPendingDeleteMode] = useState("subjects");
  const [actionLoading, setActionLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [addError, setAddError] = useState("");
  const [addProgramError, setAddProgramError] = useState("");

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

  const fetchPrograms = async () => {
    setProgramsLoading(true);
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("id, department, program_abbr, program_name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (e) {
      console.log("fetchPrograms error:", e?.message || e);
      setPrograms([]);
    } finally {
      setProgramsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (showAddSubject) setAddError("");
  }, [showAddSubject]);

  useEffect(() => {
    if (showAddProgram) setAddProgramError("");
  }, [showAddProgram]);

  const deptOptions = useMemo(
    () => [
      "All Departments",
      ...Array.from(
        new Set(
          [...subjects, ...programs]
            .map((s) => s.department)
            .filter(Boolean)
        )
      ),
    ],
    [subjects, programs]
  );

  const filteredSubjects = useMemo(() => {
    const query = q.trim().toLowerCase();
    const source =
      viewMode === "programs"
        ? programs.map((p) => ({
            id: p.id,
            department: p.department,
            course_code: p.program_abbr,
            course_name: p.program_name,
          }))
        : subjects;

    const deptFiltered =
      deptFilter === "All Departments"
        ? source
        : source.filter((s) => s.department === deptFilter);

    if (!query) return deptFiltered;
    return deptFiltered.filter((s) => {
      return (
        String(s.department || "").toLowerCase().includes(query) ||
        String(s.course_code || "").toLowerCase().includes(query) ||
        String(s.course_name || "").toLowerCase().includes(query)
      );
    });
  }, [subjects, programs, deptFilter, q, viewMode]);

  useEffect(() => {
    setPage(1);
  }, [q, deptFilter, entries, viewMode]);

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
      return false;
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
        return false;
      }

      const { error } = await supabase.from("subjects").insert({
        department: dept,
        course_code: code,
        course_name: name,
      });
      if (error) throw error;
      await fetchSubjects();
      return true;
    } catch (e) {
      console.log("Add subject failed:", e?.message || e);
      setAddError("Failed to add subject.");
      return false;
    }
  };

  const onEdit = (subject) => {
    setEditingSubject(subject);
    setPendingEditMode(viewMode);
    setEditOpen(true);
  };

  const onProgramSave = async (payload) => {
    const dept = payload?.department?.trim();
    const code = payload?.programAbbr?.trim().toUpperCase();
    const name = payload?.programName?.trim();

    if (!dept || !code || !name) {
      setAddProgramError("All fields are required.");
      return false;
    }

    try {
      setAddProgramError("");
      const { data: exists, error: existsErr } = await supabase
        .from("programs")
        .select("id, program_abbr, program_name")
        .or(`program_abbr.eq.${code},program_name.eq.${name}`)
        .limit(1);

      if (existsErr) throw existsErr;
      if (exists && exists.length > 0) {
        const dup = exists[0];
        if (dup.program_abbr === code) {
          setAddProgramError("Program abbreviation already exists.");
        } else {
          setAddProgramError("Program name already exists.");
        }
        return false;
      }

      const { error } = await supabase.from("programs").insert({
        department: dept,
        program_abbr: code,
        program_name: name,
      });
      if (error) throw error;

      await fetchPrograms();
      setViewMode("programs");
      setQ("");
      setDeptFilter("All Departments");
      setShowAddProgram(false);
      setSuccessMsg("Program added successfully!");
      setSuccessOpen(true);
      return true;
    } catch (e) {
      console.log("Add program failed:", e?.message || e);
      setAddProgramError("Failed to add program.");
      return false;
    }
  };

  const onEditSaveClick = (updated) => {
    setPendingEdit(updated);
    setPendingEditMode(viewMode);
    setApplyOpen(true);
  };

  const applyYes = async () => {
    if (!pendingEdit?.id) return;
    setActionLoading(true);
    try {
      const isProgram = pendingEditMode === "programs";
      const { error } = await supabase
        .from(isProgram ? "programs" : "subjects")
        .update(
          isProgram
            ? {
                department: pendingEdit.department,
                program_abbr: pendingEdit.course_code,
                program_name: pendingEdit.course_name,
              }
            : {
                department: pendingEdit.department,
                course_code: pendingEdit.course_code,
                course_name: pendingEdit.course_name,
              }
        )
        .eq("id", pendingEdit.id);

      if (error) throw error;

      setApplyOpen(false);
      setEditOpen(false);
      setSuccessMsg(isProgram ? "Program updated successfully!" : "Subject updated successfully!");
      setSuccessOpen(true);
      if (isProgram) {
        await fetchPrograms();
      } else {
        await fetchSubjects();
      }
    } catch (e) {
      console.log("Update subject failed:", e?.message || e);
    } finally {
      setActionLoading(false);
      setPendingEdit(null);
      setPendingEditMode("subjects");
      setEditingSubject(null);
    }
  };

  const onDeleteClick = (subject) => {
    setPendingDelete(subject);
    setPendingDeleteMode(viewMode);
    setDeleteOpen(true);
  };

  const deleteYes = async () => {
    if (!pendingDelete?.id) return;
    setActionLoading(true);
    try {
      const isProgram = pendingDeleteMode === "programs";
      const { error } = await supabase
        .from(isProgram ? "programs" : "subjects")
        .delete()
        .eq("id", pendingDelete.id);

      if (error) throw error;

      setDeleteOpen(false);
      setSuccessMsg(isProgram ? "Program deleted successfully!" : "Subject deleted successfully!");
      setSuccessOpen(true);
      if (isProgram) {
        await fetchPrograms();
      } else {
        await fetchSubjects();
      }
    } catch (e) {
      console.log("Delete subject failed:", e?.message || e);
    } finally {
      setActionLoading(false);
      setPendingDelete(null);
      setPendingDeleteMode("subjects");
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

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Subject Management');

    // 1. Define Columns (3 Columns: A to C)
    // Mas malapad ang Course Name (Col C)
    worksheet.columns = [
      { key: 'dept', width: 25 },       // A: Department
      { key: 'code', width: 20 },       // B: Code / Abbreviation
      { key: 'name', width: 45 },       // C: Name
    ];

    // 2. INSERT LOGO
    try {
      const response = await fetch('/Logo.png');
      const buffer = await response.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: buffer,
        extension: 'png',
      });
      
      // Center visually over 3 columns (Target Column B)
      worksheet.addImage(imageId, {
        tl: { col: 1, row: 0 }, // Start near end of Col A / start of Col B
        ext: { width: 292.15748031, height: 100.15748031 }
      });
    } catch (error) {
      console.warn('Logo loading failed', error);
    }

    // 3. TITLE & DATE
    
    // Title
    const titleRow = worksheet.getRow(6);
    titleRow.values = ['SUBJECT MANAGEMENT'];
    worksheet.mergeCells('A6:C6'); // Merge A to C
    titleRow.getCell(1).font = { name: 'Calibri', size: 14, bold: true };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Date
    const dateRow = worksheet.getRow(7);
    const now = new Date();
    dateRow.values = [`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`];
    worksheet.mergeCells('A7:C7'); // Merge A to C
    dateRow.getCell(1).font = { name: 'Calibri', size: 10 };
    dateRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 4. DYNAMIC HEADERS (Row 9)
    const headerRow = worksheet.getRow(9);
    
    // Check viewMode para sa tamang header text
    if (viewMode === "programs") {
        headerRow.values = ["Department", "Program Abbreviation", "Program Name"];
    } else {
        headerRow.values = ["Department", "Course Code", "Course Name"];
    }
    
    // Style Header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // 5. DATA ROWS
    filteredSubjects.forEach((s) => {
      // NOTE: Siguraduhin na tama ang field names mo dito base sa iyong data source.
      // Sinunod ko ang logic sa CSV code mo (s.department, s.course_code, s.course_name).
      const row = worksheet.addRow([
        s.department, 
        s.course_code, // Or s.program_abbreviation if viewMode is programs?
        s.course_name  // Or s.program_name if viewMode is programs?
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Alignment:
        // Dept (Col 1) = Center
        // Code (Col 2) = Center
        // Name (Col 3) = Left (Kasi mahaba ang subject name)
        if (colNumber === 3) {
             cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        } else {
             cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // 6. PRINT SETUP
    worksheet.pageSetup.printArea = `A1:C${worksheet.lastRow.number}`;
    worksheet.pageSetup.orientation = 'landscape'; // Or 'portrait' since 3 cols lang to
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1; 
    worksheet.pageSetup.fitToHeight = 0; 

    // 7. Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = viewMode === "programs" ? "Programs_List.xlsx" : "Subjects_List.xlsx";
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
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
              <div className="subj-viewToggle">
                <button
                  className={`subj-viewBtn ${viewMode === "subjects" ? "active" : ""}`}
                  onClick={() => setViewMode("subjects")}
                >
                  Subjects
                </button>
                <button
                  className={`subj-viewBtn ${viewMode === "programs" ? "active" : ""}`}
                  onClick={() => setViewMode("programs")}
                >
                  Programs
                </button>
              </div>
              <div className="subj-filter">
                <label>Department</label>
                <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                  {deptOptions.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              {viewMode === "subjects" ? (
                <button className="subj-addBtn" onClick={() => setShowAddSubject(true)}>
                  <FontAwesomeIcon icon={faPlus} /> Add Subject
                </button>
              ) : (
                <button className="subj-addBtn" onClick={() => setShowAddProgram(true)}>
                  <FontAwesomeIcon icon={faPlus} /> Add Program
                </button>
              )}
              <button className="subj-exportBtn" onClick={exportToExcel}>
                <FontAwesomeIcon icon={faDownload} /> Export XLSX
              </button>
            </div>
          </div>

          <div className="subj-tableWrap">
            <table className="subj-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>{viewMode === "programs" ? "Program Abbreviation" : "Course Code"}</th>
                  <th>{viewMode === "programs" ? "Program Name" : "Course Name"}</th>
                  <th className="subj-actionsHead">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(viewMode === "programs" ? programsLoading : subjectsLoading) ? (
                  <tr>
                    <td colSpan={4} className="subj-emptyCell">
                      {viewMode === "programs" ? "Loading programs..." : "Loading subjects..."}
                    </td>
                  </tr>
                ) : pagedSubjects.length === 0 ? (
                  <tr><td colSpan={4} className="subj-emptyCell">No {viewMode} found.</td></tr>
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
      <AddProgramModal
        open={showAddProgram}
        onClose={() => setShowAddProgram(false)}
        onSubmit={onProgramSave}
        departments={deptOptions.filter((d) => d !== "All Departments")}
        error={addProgramError}
      />
      <EditSubjectModal open={editOpen} subject={editingSubject} onClose={() => setEditOpen(false)} onSaveClick={onEditSaveClick} />
      <SuccessModal open={successOpen} message={successMsg} onClose={() => setSuccessOpen(false)} />
      <SmallConfirmModal open={applyOpen} title={actionLoading ? "Applying..." : "Apply Changes?"} onYes={applyYes} onCancel={() => setApplyOpen(false)} />
      <SmallConfirmModal
        open={deleteOpen}
        title={actionLoading ? "Deleting..." : `Delete ${pendingDelete?.course_code}?`}
        onYes={deleteYes}
        onCancel={() => setDeleteOpen(false)}
      />

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
