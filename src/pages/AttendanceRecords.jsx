import React, { useMemo, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./AttendanceRecords.css";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

/* ===== Font Awesome ===== */
import {
  faBell,
  faMagnifyingGlass,
  faCalendarDays,
  faDownload,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import supabase from "../helper/supabaseClient";

// 1. HELPERS
function csvEscape(v) {
  const s = String(v ?? "");
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatStatus(status) {
  if (!status) return "";
  const s = String(status).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getPillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "present") return "Present";
  if (s === "absent") return "Absent";
  if (s === "late") return "Late";
  return "Late";
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[parts.length - 1]?.[0] || "";
  return (a + b).toUpperCase();
}

export default function AttendanceRecords() {
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

  // Filters State
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [clazz, setClazz] = useState("All Classes");
  const [status, setStatus] = useState("All Status");
  const [prof, setProf] = useState("All Professors");

  // Data State
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("v_attendance_records")
          .select("*")
          .order("session_started_at", { ascending: false });

        if (error) throw error;
        if (alive) setAllRecords(data || []);
      } catch (e) {
        console.error(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      alive = false;
    };
  }, []);

  const staticStats = useMemo(() => ({
    total: allRecords.length,
    present: allRecords.filter(r => String(r.status).toLowerCase() === "present").length,
    absent: allRecords.filter(r => String(r.status).toLowerCase() === "absent").length,
    late: allRecords.filter(r => String(r.status).toLowerCase() === "late").length,
  }), [allRecords]);

  const filteredRecords = useMemo(() => {
    const search = q.trim().toLowerCase();
    return allRecords.filter((r) => {
      const matchesSearch = !search || 
        String(r.student_name).toLowerCase().includes(search) || 
        String(r.student_number).toLowerCase().includes(search);
      const matchesDate = !date || r.session_date === date;
      const matchesClass = clazz === "All Classes" || r.class_name === clazz;
      const matchesProf = prof === "All Professors" || r.professor_name === prof;
      const matchesStatus = status === "All Status" || 
        String(r.status).toLowerCase() === status.toLowerCase();

      return matchesSearch && matchesDate && matchesClass && matchesProf && matchesStatus;
    });
  }, [allRecords, q, date, clazz, prof, status]);

  const classOptions = useMemo(() => {
    const set = new Set(allRecords.map((r) => r.class_name).filter(Boolean));
    return ["All Classes", ...Array.from(set).sort()];
  }, [allRecords]);

  const profOptions = useMemo(() => {
    const set = new Set(allRecords.map((r) => r.professor_name).filter(Boolean));
    return ["All Professors", ...Array.from(set).sort()];
  }, [allRecords]);

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const showingFrom = filteredRecords.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, filteredRecords.length);

  useEffect(() => { setPage(1); }, [q, date, clazz, status, prof, pageSize]);

  // Function to export styled XLSX
  const exportToExcel = async () => {
    // 1. Setup Workbook at Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Records');

    // 2. Define Columns (match widths sa screenshot mo)
    worksheet.columns = [
      { key: 'student_name', width: 30 },   // A
      { key: 'student_number', width: 15 }, // B
      { key: 'session_date', width: 15 },   // C
      { key: 'class_name', width: 25 },     // D
      { key: 'status', width: 10 },         // E
      { key: 'professor_name', width: 25 }  // F
    ];

    // --- 3. INSERT LOGO ---
    // Note: Siguraduhin na nasa 'public' folder ang logo mo.
    try {
      const response = await fetch('/Logo.png'); // Palitan ng tamang file name
      const buffer = await response.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: buffer,
        extension: 'png',
      });

      // Positioning: Target cells B2:D4 visually
      worksheet.addImage(imageId, {
        tl: { col: 2, row: 0 }, // Column B gitna, Row 2
        ext: { width: 292.15748031, height: 100.15748031 } // Tantyahin ang size
      });
    } catch (error) {
      console.warn('Logo not found or failed to load', error);
    }

    // --- 4. TITLES & MERGED CELLS ---
    
    // Title: Row 6
    const titleRow = worksheet.getRow(6);
    titleRow.values = ['ATTENDLY ATTENDANCE RECORDS'];
    worksheet.mergeCells('A6:F6'); // Merge from A to F
    titleRow.getCell(1).font = { name: 'Calibri', size: 14, bold: true };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Date Generated: Row 7
    const dateRow = worksheet.getRow(7);
    const now = new Date();
    // Format date similar to screenshot: 2/17/2026, 1:09:22 PM
    const dateString = now.toLocaleDateString() + ', ' + now.toLocaleTimeString();
    dateRow.values = [`Generated: ${dateString}`];
    worksheet.mergeCells('A7:F7');
    dateRow.getCell(1).font = { name: 'Calibri', size: 10 };
    dateRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // --- 5. HEADERS (Row 9) ---
    const headerRow = worksheet.getRow(9);
    headerRow.values = ["Student Name", "Student ID", "Date", "Classes", "Status", "Professors"];
    
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

    // --- 6. DATA ROWS ---
    filteredRecords.forEach((r) => {
      // Mag-ingat sa mapping, siguraduhing tama ang fields mo
      const row = worksheet.addRow([
        r.student_name, 
        r.student_number, 
        r.session_date, 
        r.class_name, 
        r.status, 
        r.professor_name
      ]);

      // Lagyan ng border ang bawat cell sa row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        // Center alignment para sa lahat except Name (optional)
        if (cell.col !== 1) { 
           cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
           cell.alignment = { vertical: 'middle', indent: 1 };
        }
      });
    });

    // --- 7. PRINT SETUP (Para hindi putol) ---
    worksheet.pageSetup.printArea = `A1:F${worksheet.lastRow.number}`;
    worksheet.pageSetup.orientation = 'landscape'; // Landscape para kasya lapad
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1;  // <--- ITO ANG SUSI: Fit width to 1 page
    worksheet.pageSetup.fitToHeight = 0; // 0 means auto height (infinite pages pababa)
    worksheet.pageSetup.margins = {
      left: 0.25, right: 0.25,
      top: 0.75, bottom: 0.75,
      header: 0.3, footer: 0.3
    };

    // 8. Generate & Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Attendly_Records.xlsx');
  };

  return (
    <div className="app-shell ar">
      <Sidebar open={false} active="attendance" />

      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="ar-topbar-left">
            <div>
              <div className="ar-title">Attendance Records</div>
              <div className="ar-subtitle">Track attendance record</div>
            </div>
          </div>
          <div className="ar-topbar-right">
            {/* ✅ REUSABLE BELL ICON LOGIC */}
            <button className="ar-icon-btn" ref={notifRef} onClick={openNotif}>
              {unreadCount > 0 && <span className="mnt-notif-dot" />}
              <FontAwesomeIcon icon={faBell} />
            </button>
          </div>
        </div>
      </header>

      <main className="ar-main">
        {/* Stats Grid */}
        <section className="ar-stats">
          <div className="ar-stat ar-stat-white">
            <div className="ar-stat-label">Total Students</div>
            <div className="ar-stat-value">{staticStats.total}</div>
          </div>
          <div className="ar-stat ar-stat-green">
            <div className="ar-stat-label">Present</div>
            <div className="ar-stat-value">{staticStats.present}</div>
          </div>
          <div className="ar-stat ar-stat-red">
            <div className="ar-stat-label">Absent</div>
            <div className="ar-stat-value">{staticStats.absent}</div>
          </div>
          <div className="ar-stat ar-stat-yellow">
            <div className="ar-stat-label">Late</div>
            <div className="ar-stat-value">{staticStats.late}</div>
          </div>
        </section>

        {/* Data Table Card */}
        <section className="ar-dt _card">
          <div className="ar-dt-top">
            <div className="ar-dt-search">
              <span className="ar-dt-searchIcon"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
            </div>
            <div className="ar-dt-right">
              <div className="ar-dt-field">
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>All Status</option>
                  <option>Present</option>
                  <option>Absent</option>
                  <option>Late</option>
                </select>
              </div>
              <button className="ar-dt-btn primary" onClick={exportToExcel}>
                <span className="ar-dt-btnIco"><FontAwesomeIcon icon={faDownload} /></span>
                Export XLSX
              </button>
            </div>
          </div>

          <div className="ar-dt-sub">
            <div className="ar-dt-showing">
              Showing {showingFrom} to {showingTo} of {filteredRecords.length} entries
            </div>
            <div className="ar-dt-entries">
              <span>Show</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="ar-dt-filters">
            <div className="ar-dt-mini">
              <label>Date</label>
              <div className="ar-dt-date">
                <span className="ar-dt-miniIcon"><FontAwesomeIcon icon={faCalendarDays} /></span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="ar-dt-mini">
              <label>Class</label>
              <select value={clazz} onChange={(e) => setClazz(e.target.value)}>
                {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="ar-dt-mini">
              <label>Professors</label>
              <select value={prof} onChange={(e) => setProf(e.target.value)}>
                {profOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="ar-dt-table">
            <div className="ar-dt-thead">
              <div>Student Name</div>
              <div>Student ID</div>
              <div>Date</div>
              <div>Classes</div>
              <div>Professors</div>
              <div>Status</div>
            </div>
            <div className="ar-dt-tbody">
              {loading ? (
                <div className="ar-dt-empty">Loading...</div>
              ) : pagedData.length === 0 ? (
                <div className="ar-dt-empty">No records found.</div>
              ) : (
                pagedData.map((r, idx) => (
                  <div className="ar-dt-row" key={r.attendance_id || idx}>
                    <div className="ar-dt-studentCell">
                      <span className="ar-dt-avatar">{getInitials(r.student_name)}</span>
                      <div className="ar-dt-studentName">{r.student_name}</div>
                    </div>
                    <div>{r.student_number}</div>
                    <div>{r.session_date}</div>
                    <div className="ar-dt-wrap">{r.class_name}</div>
                    <div>{r.professor_name}</div>
                    <div>
                      <span className={`ar-pill ${getPillClass(r.status)}`}>
                        {formatStatus(r.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="ar-dt-pagination">
            <button 
              className="ar-dt-pageBtn" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
               <FontAwesomeIcon icon={faChevronLeft} /> Previous
            </button>
            <button className="ar-dt-pageNum active">{page}</button>
            <button 
              className="ar-dt-pageBtn" 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
            >
              Next <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </section>
      </main>

      {/* ✅ REUSABLE MODAL WITH REALTIME DATA */}
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