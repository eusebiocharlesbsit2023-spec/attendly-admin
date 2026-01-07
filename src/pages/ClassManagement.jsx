import React, { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./ClassManagement.css";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditClassModal from "../components/EditClassModal";
import ActivityHistoryModal from "../components/ActivityHistoryModal";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faRightFromBracket,
  faMagnifyingGlass,
  faDownload,
  faUserTie,
  faLocationDot,
  faClock,
  faWifi,
  faPenToSquare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

export default function ClassManagement() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);
  const notifRef = useRef(null);

  // ===== Activity (SAME AS ADMIN DASHBOARD) =====
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

  // ✅ initial data (memo)
  const initialClasses = useMemo(
    () => [
      {
        name: "Introduction to Computer Science",
        code: "CS101",
        professor: "Mrs. Sadie Mayers",
        room: "Room 303",
        schedule: "Monday: 9:00 - 11:00 AM",
        wifi: "Lab303_Wifi",
        status: "Active",
      },
      {
        name: "Introduction to Computing",
        code: "CS102",
        professor: "Mr. Michael Philips",
        room: "Room 301",
        schedule: "Tuesday: 1:00 - 3:00 PM",
        wifi: "Lab301_Wifi",
        status: "Active",
      },
      {
        name: "Sports and Fitness",
        code: "PathFit",
        professor: "Mr. Leviticus Cornwall",
        room: "Room 302",
        schedule: "Friday: 9:00 - 11:00 AM",
        wifi: "Lab302_Wifi",
        status: "Active",
      },
      {
        name: "Database Management System",
        code: "CS103",
        professor: "Mr. Arthur Morgan",
        room: "Room 304",
        schedule: "Monday: 7:00 - 10:00 AM",
        wifi: "Lab304_Wifi",
        status: "Active",
      },
    ],
    []
  );

  // ✅ real list (state) so edits/deletes update UI
  const [rows, setRows] = useState(initialClasses);

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
    if (pendingEdit?.code) {
      setRows((prev) =>
        prev.map((c) => (c.code === pendingEdit.code ? { ...c, ...pendingEdit } : c))
      );
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
    setRows((prev) => prev.filter((c) => c.code !== pendingDelete?.code));
    setDeleteOpen(false);
    setPendingDelete(null);
  };

  const deleteCancel = () => {
    setDeleteOpen(false);
    setPendingDelete(null);
  };

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
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} active="classes" />

      {/* Topbar */}
      <header className="cm-topbar">
        <div className="cm-topbar-inner">
          <div className="cm-topbar-left">
            <button
              className="cm-icon-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
              type="button"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            <div className="cm-title">Class Management</div>
          </div>

          <div className="cm-topbar-right">
            <button
              className="cm-icon-btn"
              aria-label="Notifications"
              type="button"
              onClick={() => setActivityOpen(true)}
            >
              <span className="cm-notif-dot" />
              <FontAwesomeIcon icon={faBell} />
            </button>

            <button
              className="cm-icon-btn"
              aria-label="Logout"
              type="button"
              onClick={() => navigate("/")}
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
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
                <FontAwesomeIcon icon={faMagnifyingGlass} />
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
                <FontAwesomeIcon icon={faDownload} />
              </span>
              Export CSV
            </button>
          </div>
        </section>

        {/* Cards grid */}
        <section className="cm-cards">
          {filtered.map((c) => (
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
                    <FontAwesomeIcon icon={faUserTie} />
                  </span>
                  <span>{c.professor}</span>
                </div>

                <div className="cm-line">
                  <span className="cm-ico">
                    <FontAwesomeIcon icon={faLocationDot} />
                  </span>
                  <span>{c.room}</span>
                </div>

                <div className="cm-line">
                  <span className="cm-ico">
                    <FontAwesomeIcon icon={faClock} />
                  </span>
                  <span>{c.schedule}</span>
                </div>

                <div className="cm-line">
                  <span className="cm-ico">
                    <FontAwesomeIcon icon={faWifi} />
                  </span>
                  <span>{c.wifi}</span>
                </div>
              </div>

              <div className="cm-card-actions">
                <button className="cm-editBtn" type="button" onClick={() => onEdit(c)}>
                  <span className="cm-editIco">
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </span>
                  Edit
                </button>

                <button
                  className="cm-trashBtn"
                  type="button"
                  onClick={() => onDeleteClick(c)}
                  aria-label="Delete"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}

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

      {/* Activity Modal (Bell) */}
      <ActivityHistoryModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        items={activity}
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
