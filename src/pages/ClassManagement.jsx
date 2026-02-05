import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./ClassManagement.css";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditClassModal from "../components/EditClassModal";
import supabase from "../helper/supabaseClient";

/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faMagnifyingGlass,
  faDownload,
  faPlus,
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

  // ✅ Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // filters
  const [q, setQ] = useState("");
  const [clazz, setClazz] = useState("All Classes");
  const [status, setStatus] = useState("All Status");
  const [prof, setProf] = useState("All Professors");

  // Data states
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== Fetch Logic =====
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data: classes, error: clsErr } = await supabase
        .from("classes")
        .select("id, course, course_code, room, schedule, day_of_week, start_time, end_time, professor_id, archived, class_code")
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

      setRows((classes || []).map((c) => ({
        id: c.id,
        name: c.course ?? "Untitled",
        code: c.course_code ?? "",
        professor: profMap[c.professor_id] ?? "Unassigned",
        room: c.room ?? "—",
        schedule: c.schedule ?? `${dayName(c.day_of_week)}: ${c.start_time ?? ""} - ${c.end_time ?? ""}`.trim(),
        wifi: "N/A",
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

  // ===== Handlers =====
  const onEdit = (clazzObj) => { setEditingClass(clazzObj); setEditOpen(true); };
  const onEditSaveClick = (updatedClass) => { setPendingEdit(updatedClass); setApplyOpen(true); };

  const applyYes = async () => {
    if (pendingEdit?.id) {
       // Dito mo ilalagay ang actual Supabase Update query kung gusto mo ng DB sync
       setRows((prev) => prev.map((c) => (c.id === pendingEdit.id ? { ...c, ...pendingEdit } : c)));
    }
    setApplyOpen(false); setEditOpen(false); setPendingEdit(null); setEditingClass(null);
  };

  const onDeleteClick = (clazzObj) => { setPendingDelete(clazzObj); setDeleteOpen(true); };
  const deleteYes = () => {
    setRows((prev) => prev.filter((c) => c.id !== pendingDelete?.id));
    setDeleteOpen(false); setPendingDelete(null);
  };

  // ===== Filtering =====
  const classOptions = useMemo(() => ["All Classes", ...Array.from(new Set(rows.map(c => c.code)))], [rows]);
  const profOptions = useMemo(() => ["All Professors", ...Array.from(new Set(rows.map(c => c.professor)))], [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((c) => {
      const matchesQuery = !query || c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query);
      const matchesClass = clazz === "All Classes" || c.code === clazz;
      const matchesStatus = status === "All Status" || c.status === status;
      const matchesProf = prof === "All Professors" || c.professor === prof;
      return matchesQuery && matchesClass && matchesStatus && matchesProf;
    });
  }, [rows, q, clazz, status, prof]);

  const stats = useMemo(() => ({
    total: rows.length,
    activeCount: rows.filter((c) => c.status === "Active").length,
    inactiveCount: rows.filter((c) => c.status === "Inactive").length,
  }), [rows]);

  const exportCSV = () => {
    const header = ["Class Name", "Code", "Professor", "Room", "Schedule", "WiFi", "Status"];
    const csv = [header, ...filtered.map(c => [c.name, c.code, c.professor, c.room, c.schedule, c.wifi, c.status])]
      .map(r => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "classes.csv"; a.click();
  };

  return (
    <div className="app-shell cm">
      <Sidebar open={false} active="classes" />

      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <div className="dash-title">Class Management</div>
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
            <div className="cm-field"><label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}><option>All Status</option><option>Active</option><option>Inactive</option></select>
            </div>
            <div className="cm-field"><label>Professors</label>
              <select value={prof} onChange={(e) => setProf(e.target.value)}>{profOptions.map(p => <option key={p}>{p}</option>)}</select>
            </div>
            <button className="cm-exportBtn" onClick={exportCSV}><FontAwesomeIcon icon={faDownload} /> Export CSV</button>
          </div>
        </section>

        <section className="cm-cards">
          {loading ? <div className="cm-empty">Loading classes...</div> : 
           filtered.length === 0 ? <div className="cm-empty">No classes found.</div> :
           filtered.map((c) => (
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
                <button className="cm-trashBtn" onClick={() => onDeleteClick(c)}><Svg name="trash" /></button>
              </div>
            </div>
          ))}
        </section>
      </main>

      <EditClassModal open={editOpen} clazz={editingClass} allClasses={rows} onClose={() => setEditOpen(false)} onSaveClick={onEditSaveClick} />
      <SmallConfirmModal open={applyOpen} title="Apply Changes?" onYes={applyYes} onCancel={() => setApplyOpen(false)} />
      <SmallConfirmModal open={deleteOpen} title={`Delete ${pendingDelete?.code}?`} onYes={deleteYes} onCancel={() => setDeleteOpen(false)} />

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
  return null;
}