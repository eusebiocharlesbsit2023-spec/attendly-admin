import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import ConfirmModal from "../components/ConfirmModal";
import "./AdminDashboard.css";
import "./Reports.css";
import supabase from "../helper/supabaseClient";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBell, 
  faMagnifyingGlass, 
  faDownload,
  faChevronLeft,
  faChevronRight 
} from "@fortawesome/free-solid-svg-icons";

export default function Reports() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminProfile = JSON.parse(localStorage.getItem("adminProfile")) || [];

  /* ✅ USE THE REUSABLE HOOK */
  const {
    realActivity,
    activityLoading,
    unreadCount,
    activityOpen,
    setActivityOpen,
    activityAnchorRect,
    notifRef,
    openNotif,
    refreshUnreadCount,
  } = useNotifications();

  // ===== REAL REPORTS DATA (from Supabase) =====
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsErr, setReportsErr] = useState(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [savingStatusId, setSavingStatusId] = useState(null);

  const loadReports = async () => {
    setReportsLoading(true);
    setReportsErr(null);

    try {
      const { data, error } = await supabase
        .from("support_requests")
        .select("id, user_id, email, subject, message, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data ?? []).map((r) => ({
        id: r.id,
        name: r.email || "Unknown",
        studentId: r.user_id || "—",
        subject: r.subject,
        message: r.message,
        date: (r.created_at || "").slice(0, 10),
        status: normalizeStatus(r.status),
      }));

      setReports(mapped);
    } catch (e) {
      setReportsErr(e.message || String(e));
    } finally {
      setReportsLoading(false);
    }
  };

  function normalizeStatus(s) {
    const v = String(s || "").toLowerCase();
    if (v === "open") return "Open";
    if (v === "resolved") return "Resolved";
    if (v === "pending" || v === "in_progress") return "Pending";
    if (v === "closed") return "Closed";
    return "Open";
  }

  const toDbStatus = (uiStatus) => {
    const v = String(uiStatus || "").toLowerCase();
    if (v === "open") return "open";
    if (v === "resolved") return "resolved";
    if (v === "pending") return "in_progress";
    if (v === "closed") return "closed";
    return "open";
  };

  const saveFeedbackStatus = async (id, nextUiStatus) => {
    setSavingStatusId(id);
    try {
      const { error } = await supabase
        .from("support_requests")
        .update({ status: toDbStatus(nextUiStatus) })
        .eq("id", id);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: nextUiStatus } : r))
      );

      setSuccessMsg(`Status updated to ${nextUiStatus}`);
      setSuccessOpen(true);
    } catch (e) {
      alert(`Update failed: ${e.message || e}`);
      await loadReports();
    } finally {
      setSavingStatusId(null);
    }
  };

  // SUCCESS MODAL HELPER
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

  const [menuOpen, setMenuOpen] = useState(false);

  // TAB LOGIC
  let tab = "feedback";
  if (location.pathname.includes("/reports/archive")) tab = "archive";
  if (location.pathname.includes("/reports/class-archive")) tab = "class-archive";

  useEffect(() => {
    if (tab === "feedback") loadReports();
    if (tab === "archive") loadArchived();
    if (tab === "class-archive") loadClassArchived();
  }, [tab]); // eslint-disable-line

  // datatable controls
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All"); 
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("All"); 

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const feedbackGrid = "1fr 240px 170px 1fr 160px";

  const STATUS_OPTIONS = ["Open", "Resolved", "Pending", "Closed"];

  // ARCHIVE DATA
  const [archived, setArchived] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedErr, setArchivedErr] = useState(null);

  const loadArchived = async () => {
    setArchivedLoading(true);
    setArchivedErr(null);

    try {
      const [studentsRes, profRes, adminsRes] = await Promise.all([
        supabase
          .from("students")
          .select("id, first_name, middle_name, last_name, student_number, email, archived_at")
          .eq("archived", true)
          .order("archived_at", { ascending: false }),

        supabase
          .from("professors")
          .select("id, professor_name, email, archived_at")
          .eq("archived", true)
          .order("archived_at", { ascending: false }),

        supabase
          .from("admins")
          .select("id, admin_name, username, archived_at")
          .eq("archived", true)
          .order("archived_at", { ascending: false }),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (profRes.error) throw profRes.error;
      if (adminsRes.error) throw adminsRes.error;

      const studentsMapped = (studentsRes.data ?? []).map((s) => ({
        id: s.id,
        kind: "Student",
        name: [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" "),
        studentId: s.student_number,
        email: s.email || "—",
        deletedAt: (s.archived_at || "").slice(0, 10),
        deviceId: "—",
      }));

      const profMapped = (profRes.data ?? []).map((p) => ({
        id: p.id,
        kind: "Professor",
        profId: p.id,
        name: p.professor_name,
        email: p.email || "—",
        deletedAt: (p.archived_at || "").slice(0, 10),
      }));

      const adminMapped = (adminsRes.data ?? []).map((a) => ({
        id: a.id,
        kind: "Admin",
        adminId: a.id,
        name: a.admin_name,
        email: a.username || "â€”",
        deletedAt: (a.archived_at || "").slice(0, 10),
      }));

      setArchived([...studentsMapped, ...profMapped, ...adminMapped]);
    } catch (e) {
      setArchivedErr(e.message || String(e));
    } finally {
      setArchivedLoading(false);
    }
  };

  // CLASS ARCHIVE DATA
  const [classArchived, setClassArchived] = useState([]);
  const [classArchivedLoading, setClassArchivedLoading] = useState(false);

  const loadClassArchived = async () => {
    setClassArchivedLoading(true);
    try {
      // Fetch archived classes
      const { data, error } = await supabase
        .from("classes")
        .select("id, course, course_code, room, schedule, professor_id, archived_at")
        .eq("archived", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch professor names manually to be safe
      const profIds = [...new Set((data || []).map(c => c.professor_id).filter(Boolean))];
      let profMap = {};
      if (profIds.length > 0) {
        const { data: profs } = await supabase.from("professors").select("id, professor_name").in("id", profIds);
        profMap = (profs || []).reduce((acc, p) => ({ ...acc, [p.id]: p.professor_name }), {});
      }

      const mapped = (data || []).map((c) => ({
        id: c.id,
        kind: "Class",
        name: c.course,
        code: c.course_code,
        professor: profMap[c.professor_id] || "Unassigned",
        room: c.room || "—",
        schedule: c.schedule || "—",
        deletedAt: (c.archived_at || "").slice(0, 10),
      }));

      setClassArchived(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setClassArchivedLoading(false);
    }
  };

  const applySelectStatusClass = (el, value) => {
    if (!el) return;
    const all = ["open", "resolved", "pending", "closed"];
    all.forEach((c) => el.classList.remove(`rep-status-${c}`));
    el.classList.add(`rep-status-${String(value).toLowerCase()}`);
  };

  const [fbStatusConfirmOpen, setFbStatusConfirmOpen] = useState(false);
  const [fbTargetId, setFbTargetId] = useState(null);
  const [fbPrevStatus, setFbPrevStatus] = useState("");
  const [fbNextStatus, setFbNextStatus] = useState("");
  const fbSelectRef = useRef(null);

  const requestFeedbackStatusChange = (row, next, selectEl) => {
    fbSelectRef.current = selectEl;
    setFbTargetId(row.id);
    setFbPrevStatus(row.status);
    setFbNextStatus(next);
    setFbStatusConfirmOpen(true);
  };

  const confirmFeedbackStatusChange = async () => {
    const id = fbTargetId;
    const next = fbNextStatus;
    setFbStatusConfirmOpen(false);
    await saveFeedbackStatus(id, next);
    if (fbSelectRef.current) applySelectStatusClass(fbSelectRef.current, next);
  };

  const cancelFeedbackStatusChange = () => {
    if (fbSelectRef.current) {
      fbSelectRef.current.value = fbPrevStatus;
      applySelectStatusClass(fbSelectRef.current, fbPrevStatus);
    }
    setFbStatusConfirmOpen(false);
  };

  // FILTERING
  const filteredFeedback = useMemo(() => {
    const query = q.trim().toLowerCase();
    return reports.filter((r) => {
      const okQuery = !query || String(r.id).includes(query) || r.name.toLowerCase().includes(query) ||
        r.studentId.toLowerCase().includes(query) || r.subject.toLowerCase().includes(query) || r.message.toLowerCase().includes(query);
      const okStatus = status === "All" || r.status === status;
      const okFrom = !from || r.date >= from;
      const okTo = !to || r.date <= to;
      return okQuery && okStatus && okFrom && okTo;
    });
  }, [reports, q, status, from, to]);

  const filteredArchive = useMemo(() => {
    const query = q.trim().toLowerCase();
    return archived.filter((r) => {
      const okQuery = !query || r.name.toLowerCase().includes(query) || String(r.studentId || "").toLowerCase().includes(query) ||
        String(r.profId || "").toLowerCase().includes(query) || String(r.adminId || "").toLowerCase().includes(query) ||
        String(r.email || "").toLowerCase().includes(query);
      const okType = type === "All" || r.kind === type;
      const okFrom = !from || r.deletedAt >= from;
      const okTo = !to || r.deletedAt <= to;
      return okQuery && okType && okFrom && okTo;
    });
  }, [archived, q, type, from, to]);

  const filteredClassArchive = useMemo(() => {
    const query = q.trim().toLowerCase();
    return classArchived.filter((r) => {
      const okQuery = !query || r.name.toLowerCase().includes(query) || r.code.toLowerCase().includes(query) ||
        r.professor.toLowerCase().includes(query);
      const okFrom = !from || r.deletedAt >= from;
      const okTo = !to || r.deletedAt <= to;
      return okQuery && okFrom && okTo;
    });
  }, [classArchived, q, from, to]);

  const activeRows = tab === "archive" ? filteredArchive : tab === "class-archive" ? filteredClassArchive : filteredFeedback;

  // PAGINATION
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return activeRows.slice(start, start + pageSize);
  }, [activeRows, safePage, pageSize]);

  const showingFrom = activeRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(activeRows.length, safePage * pageSize);

  useEffect(() => { setPage(1); }, [q, status, from, to, pageSize, tab, type]);

  // CSV EXPORT
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reports');

    // --- 1. CONFIGURE DYNAMIC SETTINGS BASED ON TAB ---
    let tableColumns = [];
    let tableTitle = "";
    let mergeRange = ""; // A6 hanggang saan?
    let fileName = "";
    let dataRows = []; // Dito natin i-store ang pre-mapped data

    if (tab === "feedback") {
      // --- SETTING: FEEDBACK (5 Columns) ---
      tableTitle = "FEEDBACKS";
      mergeRange = "A6:E6"; // A-E
      fileName = "Reports_Feedback.xlsx";
      
      tableColumns = [
        { key: 'name', width: 25 },       // A
        { key: 'subject', width: 20 },    // B
        { key: 'message', width: 45 },    // C (Wide for message)
        { key: 'date', width: 20 },       // D
        { key: 'status', width: 12 }      // E
      ];

      // Map Data
      dataRows = filteredFeedback.map(r => [
        r.name, r.subject, r.message, r.date, r.status
      ]);

    } else if (tab === "class-archive") {
      // --- SETTING: CLASS ARCHIVE (6 Columns) ---
      tableTitle = "CLASS ARCHIVES";
      mergeRange = "A6:F6"; // A-F
      fileName = "Reports_Class_Archive.xlsx";

      tableColumns = [
        { key: 'cname', width: 25 },      // A
        { key: 'code', width: 15 },       // B
        { key: 'prof', width: 25 },       // C
        { key: 'room', width: 15 },       // D
        { key: 'sched', width: 30 },      // E
        { key: 'delDate', width: 20 }     // F
      ];

      // Map Data
      dataRows = filteredClassArchive.map(r => [
        r.name, r.code, r.professor, r.room, r.schedule, r.deletedAt
      ]);

    } else {
      // --- SETTING: GENERAL ARCHIVE (4 Columns) ---
      tableTitle = "ARCHIVED RECORDS";
      mergeRange = "A6:D6"; // A-D lang
      fileName = "Reports_Archive.xlsx";

      tableColumns = [
        { key: 'type', width: 15 },       // A
        { key: 'name', width: 30 },       // B
        { key: 'email', width: 30 },      // C
        { key: 'delDate', width: 20 }     // D
      ];

      // Map Data
      dataRows = filteredArchive.map(r => [
        r.kind, r.name, r.email, r.deletedAt
      ]);
    }

    // --- 2. APPLY COLUMNS ---
    worksheet.columns = tableColumns;

    // --- 3. INSERT LOGO ---
    try {
      const response = await fetch('/Logo.png');
      const buffer = await response.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: buffer,
        extension: 'png',
      });

      // Center visually: 
      // Kung 6 cols, gitna sa C/D. Kung 4 cols, gitna sa B/C.
      const centerCol = tableColumns.length >= 5 ? 2.5 : 1.5; 
      
      worksheet.addImage(imageId, {
        tl: { col: centerCol, row: 0 }, 
        ext: { width: 292.15748031, height: 100.15748031 }
      });
    } catch (error) {
      console.warn('Logo loading failed', error);
    }

    // --- 4. TITLE & DATE ---
    
    // Title
    const titleRow = worksheet.getRow(6);
    titleRow.values = [tableTitle];
    worksheet.mergeCells(mergeRange); // Dynamic merge range
    titleRow.getCell(1).font = { name: 'Calibri', size: 14, bold: true };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Date
    const dateRow = worksheet.getRow(7);
    const now = new Date();
    dateRow.values = [`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`];
    // Palitan ang range string (e.g., 'A6:F6' to 'A7:F7') para sa date row
    const dateMergeRange = mergeRange.replace('6', '7').replace('6', '7'); 
    worksheet.mergeCells(dateMergeRange);
    dateRow.getCell(1).font = { name: 'Calibri', size: 10 };
    dateRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // --- 5. HEADERS (Row 9) ---
    const headerRow = worksheet.getRow(9);
    
    // Set Header Text based on tab
    if (tab === "feedback") {
      headerRow.values = ["Name", "Subject", "Message", "Submission Date", "Status"];
    } else if (tab === "class-archive") {
      headerRow.values = ["Class Name", "Code", "Professor", "Room", "Schedule", "Deleted Date"];
    } else {
      headerRow.values = ["Type", "Name", "Email", "Deleted Date"];
    }

    // Style Headers
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

    // --- 6. INSERT DATA ROWS ---
    dataRows.forEach((rowData) => {
      const row = worksheet.addRow(rowData);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Special Alignment Logic
        // Message (Feedback Col 3) = Left + Wrap Text
        if (tab === "feedback" && colNumber === 3) {
             cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        } 
        // Name/Email/Class Name usually Left aligned
        else if (colNumber === 1 || colNumber === 3) { // Adjust as needed
             cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        } 
        else {
             cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // --- 7. PRINT SETUP ---
    // Calculate last column letter based on tableColumns length
    // 4 cols -> D, 6 cols -> F
    const lastColLetter = String.fromCharCode(64 + tableColumns.length);
    
    worksheet.pageSetup.printArea = `A1:${lastColLetter}${worksheet.lastRow.number}`;
    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1; // FIT ALL COLUMNS
    worksheet.pageSetup.fitToHeight = 0;

    // --- 8. SAVE ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  // RESTORE & DELETE
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openRestore = (row) => { setRestoreTarget(row); setRestoreOpen(true); };
  const openDelete = (row) => { setDeleteTarget(row); setDeleteOpen(true); };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    setRestoreLoading(true);
    try {
      const table =
        restoreTarget.kind === "Student"
          ? "students"
          : restoreTarget.kind === "Professor"
          ? "professors"
          : restoreTarget.kind === "Admin"
          ? "admins"
          : "classes";
      
      // 1. Update the archived status
      const { error } = await supabase
        .from(table)
        .update(
          restoreTarget.kind === "Admin"
            ? { archived: false, status: "Active" }
            : { archived: false }
        )
        .eq("id", restoreTarget.id);

      if (error) throw error;

      // 2. Get current Admin Name for logging
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminData } = await supabase
        .from('admins')
        .select('admin_name')
        .eq('id', user.id)
        .single();
      
      const adminName = adminData?.admin_name || "Admin";

      // 3. Insert Activity Log
      await supabase.from('recent_activities').insert({
        activity_type: 'account_restore',
        message: `${adminName} restored ${restoreTarget.kind}: ${restoreTarget.name}`,
        metadata: { target_id: restoreTarget.id, type: restoreTarget.kind }
      });

      setSuccessMsg(`${restoreTarget.kind} restored: ${restoreTarget.name}`);
      setSuccessOpen(true);
      setRestoreOpen(false);
      
      // ✅ SIGURADUHING TAMA ANG TAWAG DITO (loadArchived, hindi loadArchive)
      if (tab === "archive") loadArchived();
      if (tab === "class-archive") loadClassArchived();
      
    } catch (e) { 
      console.error(e);
      alert(`Restore failed: ${e.message}`); 
    } finally {
      setRestoreLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteLoading) return;
    setDeleteLoading(true);
    try {
      const table = deleteTarget.kind === "Student" ? "students" : deleteTarget.kind === "Professor" ? "professors" : "classes";
      
      // 1. Permanent Delete from Table
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;

      // 1b. Also delete auth user (students/professors/admins)
      if (deleteTarget.kind === "Student" || deleteTarget.kind === "Professor" || deleteTarget.kind === "Admin") {
        const { data, error: authErr } = await supabase.functions.invoke("delete-auth-user", {
          body: { user_id: deleteTarget.id },
        });
        if (authErr || !data?.success) {
          throw new Error(authErr?.message || "Failed to delete auth user.");
        }
      }

      // 2. Logging
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminData } = await supabase
        .from('admins')
        .select('admin_name')
        .eq('id', user.id)
        .single();
      
      const adminName = adminData?.admin_name || "Admin";

      await supabase.from('recent_activities').insert({
        activity_type: 'permanent_delete',
        message: `${adminName} permanently deleted ${deleteTarget.kind}: ${deleteTarget.name}`,
        metadata: { type: deleteTarget.kind }
      });

      setSuccessMsg(`${deleteTarget.kind} permanently deleted.`);
      setSuccessOpen(true);
      setDeleteOpen(false);
      
      // ✅ Refresh the list
      if (tab === "archive") loadArchived();
      if (tab === "class-archive") loadClassArchived();
      
    } catch (e) { 
      console.error(e);
      alert(`Delete failed: ${e.message}`); 
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="app-shell rep">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="reports" />

      {/* TOP BAR */}
      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <div>
              <div className="dash-title">Reports</div>
              <div className="dash-subtitle">
                  {tab === "archive" ? "Archived students, professors & admins" : tab === "class-archive" ? "Archived classes" : "View submitted reports and status"}
              </div>
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

      {/* MAIN */}
      <main className="rep-main">
        <div className="rep-card">
          <div className="rep-dt">
            <div className="rep-dt-top">
              <div className="rep-dt-search">
                <span className="rep-dt-searchIcon"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
              </div>

              <div className="rep-dt-right">
                {tab === "feedback" ? (
                  <div className="rep-dt-field">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option>All</option>
                      {STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>
                ) : null}
                <button className="rep-dt-btn primary" onClick={exportToExcel}>
                  <span className="rep-dt-btnIco"><FontAwesomeIcon icon={faDownload} /></span> Export XLSX
                </button>
              </div>
            </div>

            <div className="rep-dt-sub">
              <div className="rep-dt-showing">Showing {showingFrom} to {showingTo} of {activeRows.length} entries</div>
              <div className="rep-dt-entries">
                <span>Show</span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option>
                </select>
                <span>entries</span>
              </div>
            </div>

            <div className="rep-dt-filters" style={{ gridTemplateColumns: tab === "archive" ? "220px 220px 220px" : "220px 220px" }}>
              <div className="rep-dt-mini"><label>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div className="rep-dt-mini"><label>To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              {tab === "archive" && (
                <div className="rep-dt-mini">
                  <label>Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="All">All</option><option value="Student">Student</option><option value="Professor">Professor</option><option value="Admin">Admin</option>
                  </select>
                </div>
              )}
            </div>

            <div className="rep-dt-table">
              {tab === "feedback" && (
                <>
                  <div className="rep-dt-thead" style={{ gridTemplateColumns: feedbackGrid }}>
                    <div>Name</div><div>Subject</div><div>Message</div><div>Submission Date</div><div>Status</div>
                  </div>
                  <div className="rep-dt-tbody">
                    {reportsLoading ? <div className="rep-dt-empty">Loading reports...</div> : 
                     paged.map((r) => (
                      <div className="rep-dt-row" key={r.id} style={{ gridTemplateColumns: feedbackGrid }}>
                        <div className="rep-dt-nameCell">
                          <span className="rep-dt-avatar">{initials(r.name)}</span>
                          <div className="rep-dt-name">{r.name}</div>
                        </div>
                        <div className="rep-subject">{r.subject}</div>
                        <div className="rep-message">{r.message}</div>
                        <div>{r.date}</div>
                        <div className="rep-dt-statusCell">
                          <select
                            disabled={savingStatusId === r.id}
                            className={`rep-statusSelect rep-status-${String(r.status).toLowerCase()}`}
                            defaultValue={r.status}
                            onChange={(e) => {
                              applySelectStatusClass(e.target, e.target.value);
                              requestFeedbackStatusChange(r, e.target.value, e.target);
                            }}
                          >
                            {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                    {!reportsLoading && paged.length === 0 && <div className="rep-dt-empty">No reports found.</div>}
                  </div>
                </>
              )}

              {tab === "archive" && (
                <div className="archive-table-wrapper">
                   {/* Archive logic follows same pattern as your original responsive grid */}
                   {(() => {
                      const isStudent = type === "Student";
                      const headGrid = type === "All" ? "120px 1fr 1fr 160px 180px" : isStudent ? "1.2fr 180px 1fr 150px 180px" : "1.2fr 1.2fr 150px 180px";
                      return (
                        <>
                          <div className="rep-dt-thead" style={{ gridTemplateColumns: headGrid }}>
                            {type === "All" && <div>Type</div>}
                            <div>Name</div>
                            <div>{isStudent ? "Student ID" : "Email"}</div>
                            {isStudent && <div>Email</div>}
                            <div>Deleted Date</div>
                            <div>Action</div>
                          </div>
                          <div className="rep-dt-tbody">
                            {archivedLoading ? <div className="rep-dt-empty">Loading archive...</div> :
                             paged.length === 0 ? <div className="rep-dt-empty">No archive user found.</div> :
                             paged.map((r, idx) => (
                              <div className="rep-dt-row" key={r.id + idx} style={{ gridTemplateColumns: headGrid }}>
                                {type === "All" && <div className="rep-typeCell">{r.kind}</div>}
                                <div className="rep-dt-nameCell">
                                  <span className="rep-dt-avatar">{initials(r.name)}</span>
                                  <div className="rep-dt-name">{r.name}</div>
                                </div>
                                <div>{isStudent ? r.studentId : r.email}</div>
                                {isStudent && <div className="rep-email">{r.email}</div>}
                                <div>{r.deletedAt}</div>
                                <div>
                                  <button className="rep-restoreBtn" onClick={() => openRestore(r)}>Restore</button>
                                  <button className="rep-deleteBtn" onClick={() => openDelete(r)}>Delete</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                   })()}
                </div>
              )}

              {tab === "class-archive" && (
                <div className="archive-table-wrapper">
                  {(() => {
                    const headGrid = "1.5fr 120px 1.2fr 120px 1.2fr 150px 180px";
                    return (
                      <>
                        <div className="rep-dt-thead" style={{ gridTemplateColumns: headGrid }}>
                          <div>Class Name</div><div>Code</div><div>Professor</div><div>Room</div><div>Schedule</div><div>Deleted Date</div><div>Action</div>
                        </div>
                        <div className="rep-dt-tbody">
                          {classArchivedLoading ? <div className="rep-dt-empty">Loading class archive...</div> :
                           paged.length === 0 ? <div className="rep-dt-empty">No archive class found.</div> :
                           paged.map((r) => (
                            <div className="rep-dt-row" key={r.id} style={{ gridTemplateColumns: headGrid }}>
                              <div className="rep-dt-nameCell">
                                <div className="rep-dt-name">{r.name}</div>
                              </div>
                              <div>{r.code}</div>
                              <div>{r.professor}</div>
                              <div>{r.room}</div>
                              <div>{r.schedule}</div>
                              <div>{r.deletedAt}</div>
                              <div>
                                <button className="rep-restoreBtn" onClick={() => openRestore(r)}>Restore</button>
                                <button className="rep-deleteBtn" onClick={() => openDelete(r)}>Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="rep-dt-pagination">
              <button className="rep-dt-pageBtn" disabled={safePage === 1} onClick={() => setPage(p => p - 1)}>
                <FontAwesomeIcon icon={faChevronLeft} /> Previous
              </button>
              <button className="rep-dt-pageNum active">{safePage}</button>
              <button className="rep-dt-pageBtn" disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}>
                Next <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ✅ REUSABLE MODAL */}
      <ActivityHistoryModal 
        open={activityOpen} 
        onClose={() => { setActivityOpen(false); refreshUnreadCount(); }} 
        items={realActivity} 
        anchorRect={activityAnchorRect} 
      />

      <ConfirmModal open={restoreOpen} title={restoreLoading ? "Restoring..." : (restoreTarget ? `Restore ${restoreTarget.kind}: ${restoreTarget.name}?` : "")} onYes={confirmRestore} onCancel={() => setRestoreOpen(false)} />
      <ConfirmModal
        open={deleteOpen}
        title={
          deleteLoading
            ? "Deleting..."
            : deleteTarget
            ? `Delete ${deleteTarget.kind}: ${deleteTarget.name}?`
            : ""
        }
        onYes={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
      <SuccessModal open={successOpen} message={successMsg} onClose={() => setSuccessOpen(false)} />
      <ConfirmModal open={fbStatusConfirmOpen} title={`Change status from "${fbPrevStatus}" to "${fbNextStatus}"?`} onYes={confirmFeedbackStatusChange} onCancel={cancelFeedbackStatusChange} />
    </div>
  );
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function initials(name) {
  const parts = String(name || "").split(" ").filter(Boolean);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts[parts.length - 1]?.[0] || "").toUpperCase();
  return (a + b) || "U";
}
