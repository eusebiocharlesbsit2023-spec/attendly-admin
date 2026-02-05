import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./ClassManagement.css";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditClassModal from "../components/EditClassModal";
import supabase from "../helper/supabaseClient";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faUsers,
  faMicrochip,
  faGraduationCap,
  faBookOpen,
  faClock,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";

export default function ClassManagement() {
  const navigate = useNavigate();
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);
  const notifRef = useRef(null);

  // ===== Edit Class + Apply Changes Confirm =====
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

  // ✅ real list (state) so edits/deletes update UI
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== Edit handlers =====
  const onEdit = (clazzObj) => {
    setEditingClass(clazzObj);
    setEditOpen(true);
  };

  // Save click inside modal -> open confirm (no alert)
  const onEditSaveClick = (updatedClass) => {
    setPendingEdit(updatedClass);
    setApplyOpen(true);
  };

  // ✅ Apply YES -> update rows immediately (temporary/local)
  const applyYes = () => {
    if (pendingEdit?.id) {
      setRows((prev) => prev.map((c) => (c.id === pendingEdit.id ? { ...c, ...pendingEdit } : c)));
    }

    setApplyOpen(false);
    setEditOpen(false);
    setPendingEdit(null);
    setEditingClass(null);
  };

  const applyCancel = () => {
    setApplyOpen(false);
    setPendingEdit(null);
  };

  // ✅ Delete handlers
  const onDeleteClick = (clazzObj) => {
    setPendingDelete(clazzObj);
    setDeleteOpen(true);
  };

  const deleteYes = () => {
    setRows((prev) => prev.filter((c) => c.id !== pendingDelete?.id));
    setDeleteOpen(false);
    setPendingDelete(null);
  };

  const deleteCancel = () => {
    setDeleteOpen(false);
    setPendingDelete(null);
  };

  const fetchClasses = async () => {
    setLoading(true);

    // 1) get classes
    const { data: classes, error: clsErr } = await supabase
      .from("classes")
      .select("id, course, course_code, room, schedule, day_of_week, start_time, end_time, professor_id, archived, class_code")
      .order("created_at", { ascending: false });

    if (clsErr) {
      console.log("Fetch classes error:", clsErr.message);
      setRows([]);
      setLoading(false);
      return;
    }

    // 2) get professors (to map id -> name)
    const profIds = Array.from(new Set((classes || []).map((c) => c.professor_id).filter(Boolean)));

    let profMap = {};
    if (profIds.length) {
      const { data: profs, error: profErr } = await supabase
        .from("professors")
        .select("id, professor_name")
        .in("id", profIds);

      if (profErr) {
        console.log("Fetch professors error:", profErr.message);
      } else {
        profMap = Object.fromEntries((profs || []).map((p) => [p.id, p.professor_name]));
      }
    }

    // helper: build schedule label (optional)
    const dayName = (d) => {
      const x = String(d ?? "").toLowerCase();
      const map = {
        mon: "Monday",
        monday: "Monday",
        tue: "Tuesday",
        tuesday: "Tuesday",
        wed: "Wednesday",
        wednesday: "Wednesday",
        thu: "Thursday",
        thursday: "Thursday",
        fri: "Friday",
        friday: "Friday",
        sat: "Saturday",
        saturday: "Saturday",
        sun: "Sunday",
        sunday: "Sunday",
      };
      return map[x] || d || "";
    };

    setRows(
      (classes || []).map((c) => ({
        // keep id for edit/delete
        id: c.id,

        // UI fields you already use
        name: c.course ?? "Untitled",
        code: c.course_code ?? "",
        professor: profMap[c.professor_id] ?? "Unassigned",
        room: c.room ?? "—",

        // you currently display `schedule` text
        schedule:
          c.schedule ??
          `${dayName(c.day_of_week)}: ${c.start_time ?? ""} - ${c.end_time ?? ""}`.trim(),

        // you have wifi in UI but DB doesn't have it
        wifi: "N/A",

        // status based on archived
        status: c.archived ? "Inactive" : "Active",

        // keep raw values for editing if needed
        professor_id: c.professor_id,
        day_of_week: c.day_of_week,
        start_time: c.start_time,
        end_time: c.end_time,
        class_code: c.class_code,
        archived: c.archived,
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // options (based on current rows)
  const classOptions = useMemo(() => {
    const set = new Set(rows.map((c) => c.code));
    return ["All Classes", ...Array.from(set)];
  }, [rows]);

  const profOptions = useMemo(() => {
    const set = new Set(rows.map((c) => c.professor));
    return ["All Professors", ...Array.from(set)];
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return rows.filter((c) => {
      const matchesQuery =
        !query || c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query);

      const matchesClass = clazz === "All Classes" || c.code === clazz;
      const matchesStatus = status === "All Status" || c.status === status;
      const matchesProf = prof === "All Professors" || c.professor === prof;

      return matchesQuery && matchesClass && matchesStatus && matchesProf;
    });
  }, [rows, q, clazz, status, prof]);

  const stats = useMemo(() => {
    const total = rows.length;
    const activeCount = rows.filter((c) => c.status === "Active").length;
    const inactiveCount = rows.filter((c) => c.status === "Inactive").length;
    return { total, activeCount, inactiveCount };
  }, [rows]);

  const exportCSV = () => {
    const header = ["Class Name", "Code", "Professor", "Room", "Schedule", "WiFi", "Status"];
    const dataRows = filtered.map((c) => [
      c.name,
      c.code,
      c.professor,
      c.room,
      c.schedule,
      c.wifi,
      c.status,
    ]);
    const csv = [header, ...dataRows].map((r) => r.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "classes.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell cm">
      {/* ✅ Sidebar now fits all pages using app-shell */}
      <Sidebar open={false} active="classes" />

      {/* Topbar */}
      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <div className="dash-title">Class Management</div>
          </div>

          <div className="mnt-topbar-right">
            <button
              className="mnt-icon-btn"
              ref={notifRef}
              aria-label="Notifications"
              type="button"
              onClick={() => {
                setActivityAnchorRect(notifRef.current?.getBoundingClientRect() ?? null);
                setActivityOpen(true);
              }}
            >
              <span className="mnt-notif-dot" />
              <FontAwesomeIcon icon={faBell} />
            </button>
          </div>
        </div>
      </header>

      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        items={[]}
        anchorRect={activityAnchorRect}
      />

      <main className="cm-main">
        {/* Stats */}
        <section className="cm-stats">
          <div className="cm-stat cm-stat-white">
            <div className="cm-stat-label">Total Classes</div>
            <div className="cm-stat-value">{stats.total}</div>
          </div>

          <div className="cm-stat cm-stat-green">
            <div className="cm-stat-label">Active Classes</div>
            <div className="cm-stat-value">{stats.activeCount}</div>
          </div>

          <div className="cm-stat cm-stat-red">
            <div className="cm-stat-label">Inactive Classes</div>
            <div className="cm-stat-value">{stats.inactiveCount}</div>
          </div>
        </section>

        {/* Filters panel */}
        <section className="cm-filters card">
          <div className="cm-searchRow">
            <div className="cm-search">
              <span className="cm-searchIcon">
                <Svg name="search" />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or Id"
              />
            </div>
          </div>

          <div className="cm-filterGrid">
            <div className="cm-field">
              <label>Class</label>
              <select value={clazz} onChange={(e) => setClazz(e.target.value)}>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="cm-field">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div className="cm-field">
              <label>Professors</label>
              <select value={prof} onChange={(e) => setProf(e.target.value)}>
                {profOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <button className="cm-exportBtn" type="button" onClick={exportCSV}>
              <span className="cm-exportIcon">
                <Svg name="download" />
              </span>
              Export CSV
            </button>
          </div>
        </section>

        {/* Cards grid */}
        <section className="cm-cards">
          {
            loading ? (
              <div className="cm-empty">Loading classes...</div>
            ) : filtered.length === 0 ? (
              <div className="cm-empty">No classes found.</div>
            ) : (
              filtered.map((c) => (
                <div className="cm-card" key={c.code + c.name}>
                  <div className="cm-card-top">
                    <div>
                      <div className="cm-card-name">{c.name}</div>
                      <div className="cm-card-code">{c.code}</div>
                    </div>

                    <span className={`cm-pill ${c.status === "Active" ? "active" : "inactive"}`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="cm-card-body">
                    <div className="cm-line">
                      <span className="cm-ico">
                        <Svg name="user" />
                      </span>
                      <span>{c.professor}</span>
                    </div>
                    <div className="cm-line">
                      <span className="cm-ico">
                        <Svg name="pin" />
                      </span>
                      <span>{c.room}</span>
                    </div>
                    <div className="cm-line">
                      <span className="cm-ico">
                        <Svg name="clock" />
                      </span>
                      <span>{c.schedule}</span>
                    </div>
                    <div className="cm-line">
                      <span className="cm-ico">
                        <Svg name="wifi" />
                      </span>
                      <span>{c.wifi}</span>
                    </div>
                  </div>

                  <div className="cm-card-actions">
                    <button className="cm-editBtn" type="button" onClick={() => onEdit(c)}>
                      <span className="cm-editIco">
                        <Svg name="edit" />
                      </span>
                      Edit
                    </button>

                    <button
                      className="cm-trashBtn"
                      type="button"
                      onClick={() => onDeleteClick(c)}
                      aria-label="Delete"
                    >
                      <Svg name="trash" />
                    </button>
                  </div>
                </div>
              ))
            )}
          {filtered.length === 0 && <div className="cm-empty">No classes found.</div>}
        </section>
      </main>

      {/* Edit modal */}
      <EditClassModal
        open={editOpen}
        clazz={editingClass}
        allClasses={rows}
        onClose={() => setEditOpen(false)}
        onSaveClick={onEditSaveClick}
      />

      {/* Apply confirm */}
      <SmallConfirmModal open={applyOpen} title="Apply Changes?" onYes={applyYes} onCancel={applyCancel} />

      {/* Delete confirm */}
      <SmallConfirmModal
        open={deleteOpen}
        title={`Delete ${pendingDelete?.code || "this class"}?`}
        onYes={deleteYes}
        onCancel={deleteCancel}
      />
    </div>
  );
}

/* helpers */
function csvEscape(v) {
  const s = String(v ?? "");
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/* icons */
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

    /* ✅ FIXED: SOLID (FILLED) BELL */
    case "bell":
      return (
        <svg
          width={20}
          height={22}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"  /* <<< solid */
        >
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z" />
          <path d="M20 19H4v-1l2-2v-5a6 6 0 1 1 12 0v5l2 2v1Z" />
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

    case "user":
      return (
        <svg {...common}>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" />
          <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "pin":
      return (
        <svg {...common}>
          <path
            d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="2" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "wifi":
      return (
        <svg {...common}>
          <path d="M5 12.55a11 11 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8.5 15.5a6 6 0 0 1 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M11 18.5a2 2 0 0 1 2 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
