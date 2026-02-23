import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./ClassManagement.css";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditClassModal from "../components/EditClassModal";
import supabase from "../helper/supabaseClient";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faMagnifyingGlass,
  faDownload,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export default function ClassManagement() {
  const navigate = useNavigate();

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

  // ===== Edit Class States =====
  const [editOpen, setEditOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [pendingEdit, setPendingEdit] = useState(null);
  const [editValidationMsg, setEditValidationMsg] = useState("");

  // ✅ Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [clazz, setClazz] = useState("All Classes");
  const [prof, setProf] = useState("All Professors");
  const [deptFilter, setDeptFilter] = useState("All Departments");

  // Data states
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState(4);
  const [page, setPage] = useState(1);

  // ===== Fetch Logic =====
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data: classes, error: clsErr } = await supabase
        .from("classes")
        .select("id, course, course_code, room, schedule, day_of_week, start_time, end_time, professor_id, archived, class_code, room_ap")
        .eq("archived", false)
        .order("created_at", { ascending: false });

      if (clsErr) throw clsErr;

      const profIds = Array.from(new Set((classes || []).map((c) => c.professor_id).filter(Boolean)));
      let profMap = {};
      
      if (profIds.length) {
        const { data: profs, error: profErr } = await supabase
          .from("professors")
          .select("id, professor_name")
          .in("id", profIds);
        if (!profErr) profMap = Object.fromEntries((profs || []).map((p) => [p.id, p.professor_name]));
      }

      const dayName = (d) => {
        const map = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
        return map[String(d ?? "").toLowerCase().slice(0,3)] || d || "";
      };
      const formatTime12 = (t) => {
        if (!t) return "";
        const [hh, mm] = String(t).split(":");
        let h = Number(hh);
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${mm} ${ampm}`.trim();
      };

      setRows((classes || []).map((c) => ({
        id: c.id,
        name: c.course ?? "Untitled",
        code: c.course_code ?? "",
        professor: profMap[c.professor_id] ?? "Unassigned",
        room: c.room ?? "—",
        schedule: c.schedule ?? `${dayName(c.day_of_week)}: ${formatTime12(c.start_time)} - ${formatTime12(c.end_time)}`.trim(),
        wifi: c.room_ap ?? "No WiFi assigned",
        status: c.archived ? "Inactive" : "Active",
        professor_id: c.professor_id,
        day_of_week: c.day_of_week,
        start_time: c.start_time,
        end_time: c.end_time,
        class_code: c.class_code,
        archived: c.archived,
      })));
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);


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

  const getStartedSessionLock = async (classId) => {
    if (!classId) return "";
    const { count, error } = await supabase
      .from("class_sessions")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("status", "started");

    if (error) throw error;
    if ((count ?? 0) > 0) {
      return "This class has an ongoing session. Editing is disabled until the session is ended.";
    }
    return "";
  };

  // ===== Handlers =====
  const onEdit = async (clazzObj) => {
    setEditValidationMsg("");
    setEditingClass(clazzObj);
    setEditOpen(true);
    try {
      const lockMessage = await getStartedSessionLock(clazzObj?.id);
      setEditValidationMsg(lockMessage);
    } catch (err) {
      console.error("Session lock check failed:", err.message);
      setEditValidationMsg("Unable to validate class session status. Try again before editing.");
    }
  };
  const onEditSaveClick = (updatedClass) => { setPendingEdit(updatedClass); setApplyOpen(true); };

  const normalizeDay = (value) => {
    const map = {
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
      sun: "Sunday",
    };
    const raw = String(value || "").trim();
    const key = raw.toLowerCase().slice(0, 3);
    return map[key] || raw;
  };

  const toMinutes = (value) => {
    const [hh, mm] = String(value || "").split(":");
    const h = Number(hh);
    const m = Number(mm || 0);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const isInScheduleSpan = (clazzObj) => {
    if (!clazzObj?.day_of_week || !clazzObj?.start_time || !clazzObj?.end_time) return false;
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[now.getDay()];
    if (normalizeDay(clazzObj.day_of_week) !== today) return false;

    const start = toMinutes(clazzObj.start_time);
    const end = toMinutes(clazzObj.end_time);
    if (start == null || end == null) return false;

    const current = now.getHours() * 60 + now.getMinutes();
    return current >= start && current < end;
  };

  const applyYes = async () => {
    if (pendingEdit?.id) {
      try {
        const lockMessage = await getStartedSessionLock(pendingEdit.id);
        if (lockMessage) {
          setEditValidationMsg(lockMessage);
          setApplyOpen(false);
          setPendingEdit(null);
          return;
        }
      } catch (err) {
        console.error("Session lock check failed:", err.message);
        setEditValidationMsg("Unable to validate class session status. Try again before editing.");
        setApplyOpen(false);
        setPendingEdit(null);
        return;
      }

      try {
        // ✅ Magdagdag ng actual Supabase update para permanenteng ma-save
        const { error } = await supabase
          .from("classes")
          .update({
            course: pendingEdit.name,
            course_code: pendingEdit.code,
            room_ap: pendingEdit.wifi,
            room: pendingEdit.room,
            day_of_week: pendingEdit.day_of_week,
            start_time: pendingEdit.start_time,
            end_time: pendingEdit.end_time,
            schedule: pendingEdit.schedule,
          })
          .eq("id", pendingEdit.id);

        if (error) throw error;

        setRows((prev) => prev.map((c) => (c.id === pendingEdit.id ? { ...c, ...pendingEdit } : c)));
        setSuccessMsg("Class updated successfully!");
        setSuccessOpen(true);
      } catch (err) {
        console.error("Update failed:", err.message);
      }
    }
    setApplyOpen(false); 
    setEditOpen(false); 
    setPendingEdit(null); 
    setEditingClass(null);
    setEditValidationMsg("");
  };

  const onDeleteClick = (clazzObj) => { setPendingDelete(clazzObj); setDeleteOpen(true); };

  const deleteYes = async () => {
    if (pendingDelete?.id) {
      if (isInScheduleSpan(pendingDelete)) return;
      try {
        // 1. I-update ang record sa Supabase database
        const { error } = await supabase
          .from("classes")
          .update({ archived: true })
          .eq("id", pendingDelete.id);

        if (error) throw error;

        // 2. I-update ang local state para maging "Inactive" ang status sa UI
        setRows((prev) =>
          prev.map((c) =>
            c.id === pendingDelete.id ? { ...c, status: "Inactive", archived: true } : c
          )
        );
        
        // Optional: Kung gusto mong mawala agad sa listahan ang inarchive:
        // setRows((prev) => prev.filter((c) => c.id !== pendingDelete.id));

        setSuccessMsg("Class archived successfully!");
        setSuccessOpen(true);
        await fetchClasses();
      } catch (err) {
        console.error("Archive failed:", err.message);
      }
    }
    setDeleteOpen(false);
    setPendingDelete(null);
  };

  const archiveBlockedBySchedule = pendingDelete ? isInScheduleSpan(pendingDelete) : false;

  // ===== Filtering =====
  const classOptions = useMemo(() => ["All Classes", ...Array.from(new Set(rows.map(c => c.code)))], [rows]);
  const profOptions = useMemo(() => ["All Professors", ...Array.from(new Set(rows.map(c => c.professor)))], [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((c) => {
      const matchesQuery = !query || c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query);
      const matchesClass = clazz === "All Classes" || c.code === clazz;
      const matchesProf = prof === "All Professors" || c.professor === prof;
      return matchesQuery && matchesClass && matchesProf;
    });
  }, [rows, q, clazz, prof]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entries));
  const safePage = Math.min(page, totalPages);
  const paginatedClasses = useMemo(() => {
    const start = (safePage - 1) * entries;
    return filtered.slice(start, start + entries);
  }, [filtered, safePage, entries]);

  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * entries + 1;
  const showingTo = Math.min(filtered.length, (safePage - 1) * entries + paginatedClasses.length);

  useEffect(() => {
    setPage(1);
  }, [q, clazz, prof, entries]);


  const stats = useMemo(() => ({
    total: rows.length,
    activeCount: rows.filter((c) => c.status === "Active").length,
    inactiveCount: rows.filter((c) => c.status === "Inactive").length,
  }), [rows]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Class Management');

    // 1. Define Columns (7 Columns: A to G)
    worksheet.columns = [
      { key: 'name', width: 30 },      // A: Class Name
      { key: 'code', width: 15 },      // B: Code
      { key: 'professor', width: 25 }, // C: Professor
      { key: 'room', width: 15 },      // D: Room
      { key: 'schedule', width: 35 },  // E: Schedule (Malapad dapat)
      { key: 'wifi', width: 20 },      // F: WiFi
      { key: 'status', width: 12 }     // G: Status
    ];

    // 2. INSERT LOGO
    try {
      const response = await fetch('/Logo.png'); // Nasa public folder
      const buffer = await response.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: buffer,
        extension: 'png',
      });
      
      // Center visually: Target Columns C-E roughly
      worksheet.addImage(imageId, {
        tl: { col: 2.9, row: 0 }, // Start mid-Column C, Row 2
        ext: { width: 292.15748031, height: 100.15748031 }
      });
    } catch (error) {
      console.warn('Logo loading failed', error);
    }

    // 3. TITLE & DATE (Row 6 & 7)
    
    // Title
    const titleRow = worksheet.getRow(6);
    titleRow.values = ['CLASS MANAGEMENT'];
    worksheet.mergeCells('A6:G6'); // Merge A to G (7 columns)
    titleRow.getCell(1).font = { name: 'Calibri', size: 14, bold: true };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Date
    const dateRow = worksheet.getRow(7);
    const now = new Date();
    dateRow.values = [`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`];
    worksheet.mergeCells('A7:G7'); // Merge A to G
    dateRow.getCell(1).font = { name: 'Calibri', size: 10 };
    dateRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 4. TABLE HEADER (Row 9)
    const headerRow = worksheet.getRow(9);
    headerRow.values = ["Class Name", "Code", "Professor", "Room", "Schedule", "WiFi", "Status"];
    
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
    filtered.forEach((c) => {
      const row = worksheet.addRow([
        c.name, 
        c.code, 
        c.professor, 
        c.room, 
        c.schedule, 
        c.wifi, 
        c.status
      ]);

      row.eachCell((cell, colNumber) => {
        // Add Borders
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Alignment Rules:
        // Class Name (Col 1) = Left
        // Schedule (Col 5) = Left (kasi mahaba text nito minsan)
        // Others = Center
        if (colNumber === 1 || colNumber === 5) {
             cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        } else {
             cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // 6. PRINT SETUP
    worksheet.pageSetup.printArea = `A1:G${worksheet.lastRow.number}`;
    worksheet.pageSetup.orientation = 'landscape'; 
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1; // Susi para hindi putol ang Columns A-G
    worksheet.pageSetup.fitToHeight = 0; 

    // 7. Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Class_List.xlsx');
  };


  return (
    <div className="app-shell cm">
      <Sidebar open={false} active="classes" />

      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <button type="button" className="cm-back-btn" onClick={() => navigate(-1)} aria-label="Back" title="Back">
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <div className="pm-title">Class Management</div>
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

      <main className="cm-main">
        <section className="cm-stats">
          <div className="cm-stat cm-stat-white"><div className="cm-stat-label">Total Classes</div><div className="cm-stat-value">{stats.total}</div></div>
          <div className="cm-stat cm-stat-green"><div className="cm-stat-label">Active Classes</div><div className="cm-stat-value">{stats.activeCount}</div></div>
          <div className="cm-stat cm-stat-red"><div className="cm-stat-label">Inactive Classes</div><div className="cm-stat-value">{stats.inactiveCount}</div></div>
        </section>

        <section className="cm-filters card">
          <div className="cm-searchRow">
            <div className="cm-search">
              <span className="cm-searchIcon"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or Id" />
            </div>
          </div>

          <div className="cm-filterGrid">
            <div className="cm-field"><label>Class</label>
              <select value={clazz} onChange={(e) => setClazz(e.target.value)}>{classOptions.map(c => <option key={c}>{c}</option>)}</select>
            </div>
            <div className="cm-field"><label>Professors</label>
              <select value={prof} onChange={(e) => setProf(e.target.value)}>{profOptions.map(p => <option key={p}>{p}</option>)}</select>
            </div>
            <button className="cm-exportBtn" onClick={exportToExcel}><FontAwesomeIcon icon={faDownload} /> Export XLSX</button>
          </div>
          <div className="cm-entriesInline">
            <span className="cm-entriesLabel">Show</span>
            <select value={entries} onChange={(e) => setEntries(Number(e.target.value))}>
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
            </select>
            <span className="cm-entriesLabel">entries</span>
          </div>
        </section>

        <section className="cm-cards">
          {loading ? <div className="cm-empty">Loading classes...</div> : 
           filtered.length === 0 ? <div className="cm-empty">No classes found.</div> :
           paginatedClasses.map((c) => (
            <div className="cm-card" key={c.id}>
              <div className="cm-card-top">
                <div><div className="cm-card-name">{c.name}</div><div className="cm-card-code">{c.code}</div></div>
                <span className={`cm-pill ${c.status === "Active" ? "active" : "inactive"}`}>{c.status}</span>
              </div>
              <div className="cm-card-body">
                <div className="cm-line"><Svg name="user" /><span>{c.professor}</span></div>
                <div className="cm-line"><Svg name="pin" /><span>{c.room}</span></div>
                <div className="cm-line"><Svg name="clock" /><span>{c.schedule}</span></div>
                <div className="cm-line"><Svg name="wifi" /><span>{c.wifi}</span></div>
              </div>
              <div className="cm-card-actions">
                <button className="cm-editBtn" onClick={() => onEdit(c)}><Svg name="edit" /> Edit</button>
                <button className="cm-trashBtn" onClick={() => onDeleteClick(c)}>
                  <Svg name="archive" /> {/* Pwedeng palitan ang icon name */}
                </button>
              </div>
            </div>
          ))}
        </section>
        <div className="cm-footer">
          <div className="cm-footerLeft">Showing {showingFrom} to {showingTo} of {filtered.length} entries</div>
          <div className="cm-footerRight">
            <button className="cm-pageBtn" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
              <FontAwesomeIcon icon={faChevronLeft} /> Previous
            </button>
            <button className="cm-pageNum active">{safePage}</button>
            <button className="cm-pageBtn" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </main>

      <EditClassModal
        open={editOpen}
        clazz={editingClass}
        allClasses={rows}
        editBlockedReason={editValidationMsg}
        onClose={() => {
          setEditOpen(false);
          setEditValidationMsg("");
        }}
        onSaveClick={onEditSaveClick}
      />
      <SmallConfirmModal open={applyOpen} title="Apply Changes?" onYes={applyYes} onCancel={() => setApplyOpen(false)} />
      <SmallConfirmModal 
        open={deleteOpen} 
        title={archiveBlockedBySchedule ? `Cannot Archive ${pendingDelete?.code}` : `Archive ${pendingDelete?.code}?`}
        description={archiveBlockedBySchedule ? "This class is currently within its scheduled time span." : ""}
        yesDisabled={archiveBlockedBySchedule}
        onYes={deleteYes} 
        onCancel={() => setDeleteOpen(false)} 
      />
      <SuccessModal open={successOpen} message={successMsg} onClose={() => setSuccessOpen(false)} />

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

function csvEscape(v) {
  const s = String(v ?? "");
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function Svg({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "user") return <svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  if (name === "pin") return <svg {...common}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (name === "wifi") return <svg {...common}><path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M8.5 15.5a6 6 0 0 1 7 0"/><path d="M11 18.5a2 2 0 0 1 2 0"/></svg>;
  if (name === "edit") return <svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
  if (name === "trash") return <svg {...common}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
  if (name === "archive") return (
  <svg {...common}>
    <polyline points="21 8 21 21 3 21 3 8"></polyline>
    <rect x="1" y="3" width="22" height="5"></rect>
    <line x1="10" y1="12" x2="14" y2="12"></line>
  </svg>
);
  return null;
}
