import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import ConfirmModal from "../components/ConfirmModal";
import "./AdminDashboard.css";
import "./Reports.css";
import supabase from "../helper/supabaseClient";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faMagnifyingGlass, faDownload } from "@fortawesome/free-solid-svg-icons";

export default function Reports() {
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
  if (v === "pending") return "in_progress"; // ✅ mapping mo
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

    // ✅ update UI state
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nextUiStatus } : r))
    );

    setSuccessMsg(`Status updated to ${nextUiStatus}`);
    setSuccessOpen(true);
  } catch (e) {
    alert(`Update failed: ${e.message || e}`);
    // ✅ reload para bumalik sa tamang value
    await loadReports();
  } finally {
    setSavingStatusId(null);
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
    <div className="scm-overlay" onMouseDown={onClose}>
      <div className="scm-card" onMouseDown={(e) => e.stopPropagation()}>
        <i className="bx bx-check-circle"></i>
        <p className="scm-text">{message}</p>
      </div>
    </div>
  );
}

  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);

  // ✅ Sidebar (para hindi mawala)
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ notif anchor rect
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);

  // ===== Activity =====
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

  // ===== TAB (same file, route-based) =====

  // ✅ declare tab FIRST
  const tab = location.pathname.includes("/reports/archive") ? "archive" : "feedback";

  // ✅ saka gamitin sa useEffect
  useEffect(() => {
    if (tab === "feedback") loadReports();
    if (tab === "archive") loadArchived();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // datatable controls
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All"); // feedback filter only
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // ✅ Archive dropdown beside dates (FILTER ONLY)
  const [type, setType] = useState("All"); // All | Student | Professor

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ✅ Status options for dropdown
  const STATUS_OPTIONS = ["Open", "Resolved", "Pending", "Closed"];

  // ===== ARCHIVE (deleted students & professors) =====
  const [archived, setArchived] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedErr, setArchivedErr] = useState(null);

  const loadArchived = async () => {
    setArchivedLoading(true);
    setArchivedErr(null);

    try {
      const [studentsRes, profRes] = await Promise.all([
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
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (profRes.error) throw profRes.error;

      const studentsMapped = (studentsRes.data ?? []).map((s) => ({
        id: s.id, // ✅ REQUIRED
        kind: "Student",
        name: [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" "),
        studentId: s.student_number,
        email: s.email || "—",
        deletedAt: (s.archived_at || "").slice(0, 10),
        deviceId: "—",
      }));

      const profMapped = (profRes.data ?? []).map((p) => ({
        id: p.id, // ✅ REQUIRED
        kind: "Professor",
        profId: p.id,
        name: p.professor_name,
        email: p.email || "—",
        deletedAt: (p.archived_at || "").slice(0, 10),
      }));

      setArchived([...studentsMapped, ...profMapped]);
    } catch (e) {
      setArchivedErr(e.message || String(e));
    } finally {
      setArchivedLoading(false);
    }
  };


  // ===== helper: apply colored class to the status select =====
  const applySelectStatusClass = (el, value) => {
    if (!el) return;
    const all = ["open", "resolved", "pending", "closed"];
    all.forEach((c) => el.classList.remove(`rep-status-${c}`));
    el.classList.add(`rep-status-${String(value).toLowerCase()}`);
  };

  // ===== FEEDBACK STATUS CONFIRM (dropdown + confirm) =====
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

    if (fbSelectRef.current) {
      applySelectStatusClass(fbSelectRef.current, next);
    }

    setFbTargetId(null);
    setFbPrevStatus("");
    setFbNextStatus("");
    fbSelectRef.current = null;
  };

  const cancelFeedbackStatusChange = () => {
    // revert UI dropdown to previous status + color
    if (fbSelectRef.current) {
      fbSelectRef.current.value = fbPrevStatus;
      applySelectStatusClass(fbSelectRef.current, fbPrevStatus);
    }

    setFbStatusConfirmOpen(false);
    setFbTargetId(null);
    setFbPrevStatus("");
    setFbNextStatus("");
    fbSelectRef.current = null;
  };

  // ===== FILTERING =====
  const filteredFeedback = useMemo(() => {
    const query = q.trim().toLowerCase();

    return reports.filter((r) => {
      const okQuery =
        !query ||
        String(r.id).includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.studentId.toLowerCase().includes(query) ||
        r.subject.toLowerCase().includes(query) ||
        r.message.toLowerCase().includes(query);

      const okStatus = status === "All" || r.status === status;
      const okFrom = !from || r.date >= from;
      const okTo = !to || r.date <= to;

      return okQuery && okStatus && okFrom && okTo;
    });
  }, [reports, q, status, from, to]);

  const filteredArchive = useMemo(() => {
    const query = q.trim().toLowerCase();

    return archived.filter((r) => {
      const okQuery =
        !query ||
        r.name.toLowerCase().includes(query) ||
        String(r.studentId || "").toLowerCase().includes(query) ||
        String(r.profId || "").toLowerCase().includes(query) ||
        String(r.email || "").toLowerCase().includes(query) ||
        String(r.deviceId || "").toLowerCase().includes(query);

      const okType = type === "All" || r.kind === type;
      const okFrom = !from || r.deletedAt >= from;
      const okTo = !to || r.deletedAt <= to;

      return okQuery && okType && okFrom && okTo;
    });
  }, [archived, q, type, from, to]);

  const activeRows = tab === "archive" ? filteredArchive : filteredFeedback;

  // ===== Pagination =====
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return activeRows.slice(start, start + pageSize);
  }, [activeRows, safePage, pageSize]);

  const showingFrom = activeRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(activeRows.length, safePage * pageSize);

  // reset page on changes
  useEffect(() => {
    setPage(1);
  }, [q, status, from, to, pageSize, tab, type]);

  // ===== Export CSV =====
  const exportCSV = () => {
    if (tab === "feedback") {
      const header = ["ID", "Name", "Student ID", "Subject", "Message", "Submission Date", "Status"];
      const rows = filteredFeedback.map((r) => [r.id, r.name, r.studentId, r.subject, r.message, r.date, r.status]);
      const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
      downloadCSV(csv, "reports-feedback.csv");
      return;
    }

    // Archive export: keep kind in CSV even if hidden in table
    const header = ["Type", "Name", "ID", "Device ID", "Email", "Deleted Date"];
    const rows = filteredArchive.map((r) => [
      r.kind,
      r.name,
      r.kind === "Student" ? r.studentId : r.profId,
      r.kind === "Student" ? r.deviceId : "",
      r.email,
      r.deletedAt,
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    downloadCSV(csv, "reports-archive.csv");
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ===== Restore confirm (archive only) =====
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);

  const openRestore = (row) => {
    setRestoreTarget(row);
    setRestoreOpen(true);
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;

    try {
      // Student restore
      if (restoreTarget.kind === "Student") {
        const { error } = await supabase
          .from("students")
          .update({ archived: false })
          .eq("id", restoreTarget.id);

        if (error) throw error;

        setSuccessMsg(`Student restored: ${restoreTarget.name} (${restoreTarget.studentId})`);
      }

      // Professor restore
      if (restoreTarget.kind === "Professor") {
        const { error } = await supabase
          .from("professors")
          .update({ archived: false })
          .eq("id", restoreTarget.id);

        if (error) throw error;

        setSuccessMsg(`Professor restored: ${restoreTarget.name}`);
      }

      setSuccessOpen(true);

      // ✅ close confirm modal
      setRestoreOpen(false);
      setRestoreTarget(null);

      // ✅ refresh archive list (if you fetch archive from DB)
      await loadArchive(); 
    } catch (e) {
      alert(`Restore failed: ${e.message || e}`);
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
                {tab === "archive" ? "Archived (deleted) students & professors" : "View submitted reports and status"}
              </div>
            </div>
          </div>

          <div className="mnt-topbar-right">
            <button
              className="mnt-icon-btn"
              type="button"
              ref={notifRef}
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

      {/* MAIN */}
      <main className="rep-main">
        <div className="rep-card">
          <div className="rep-dt">
            {/* Top controls */}
            <div className="rep-dt-top">
              <div className="rep-dt-search">
                <span className="rep-dt-searchIcon">
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
              </div>

              <div className="rep-dt-right">
                {tab === "feedback" && (
                  <div className="rep-dt-field">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option>All</option>
                      <option>Open</option>
                      <option>Resolved</option>
                      <option>Pending</option>
                      <option>Closed</option>
                    </select>
                  </div>
                )}

                <button className="rep-dt-btn primary" type="button" onClick={exportCSV}>
                  <span className="rep-dt-btnIco">
                    <FontAwesomeIcon icon={faDownload} />
                  </span>
                  Export CSV
                </button>
              </div>
            </div>

            {/* showing + entries */}
            <div className="rep-dt-sub">
              <div className="rep-dt-showing">
                Showing {showingFrom} to {showingTo} of {activeRows.length} entries
              </div>

              <div className="rep-dt-entries">
                <span>Show</span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <span>entries</span>
              </div>
            </div>

            {/* Filters row */}
            <div
              className="rep-dt-filters"
              style={{ gridTemplateColumns: tab === "archive" ? "220px 220px 220px" : "220px 220px" }}
            >
              <div className="rep-dt-mini">
                <label>From</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>

              <div className="rep-dt-mini">
                <label>To</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>

              {tab === "archive" && (
                <div className="rep-dt-mini">
                  <label>Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="All">All</option>
                    <option value="Student">Student</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>
              )}
            </div>

            {/* TABLE */}
            <div className="rep-dt-table">
              {tab === "feedback" ? (
                <>
                  <div className="rep-dt-thead">
                    <div>ID</div>
                    <div>Name</div>
                    <div>Subject</div>
                    <div>Message</div>
                    <div>Submission Date</div>
                    <div>Status</div>
                  </div>

                  <div className="rep-dt-tbody">
                    {reportsLoading && (
                      <div className="rep-dt-empty">Loading reports...</div>
                    )}

                    {reportsErr && (
                      <div className="rep-dt-empty">Error: {reportsErr}</div>
                    )}

                    {!reportsLoading && !reportsErr && paged.map((r) => (
                      <div className="rep-dt-row" key={r.id}>
                        <div>{String(r.id).slice(0, 8)}</div>

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
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    {!reportsLoading && !reportsErr && paged.length === 0 && (
                      <div className="rep-dt-empty">No reports found.</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* ✅ ARCHIVE TABLE (DYNAMIC COLUMNS BASED ON TYPE) */}
                  {(() => {
                    const isAll = type === "All";
                    const isStudent = type === "Student";
                    const isProfessor = type === "Professor";

                    // ✅ Type column ONLY when All
                    const headGrid = isAll
                      ? "120px minmax(260px, 1.2fr) minmax(220px, 1fr) 160px 120px" // Type, Name, Email, Deleted, Action
                      : isStudent
                      ? "minmax(260px, 1.2fr) 200px 160px minmax(220px, 1fr) 160px 120px" // Name, StudentID, Device, Email, Deleted, Action
                      : "minmax(260px, 1.2fr) minmax(220px, 1fr) 160px 120px"; // Name, Email, Deleted, Action

                    const rowGrid = headGrid;

                    return (
                      <>
                        <div className="rep-dt-thead" style={{ gridTemplateColumns: headGrid }}>
                          {isAll && <div>Type</div>}

                          <div>{isStudent ? "Student Name" : isProfessor ? "Professor Name" : "Name"}</div>

                          {isStudent ? <div>Student ID</div> : <div>Email</div>}

                          {isStudent && <div>Device ID</div>}

                          {isStudent && <div>Email</div>}

                          <div>Deleted Date</div>
                          <div>Action</div>
                        </div>

                        <div className="rep-dt-tbody">
                          {archivedLoading && <div className="rep-dt-empty">Loading archive...</div>}
                          {archivedErr && <div className="rep-dt-empty">Error: {archivedErr}</div>}
                          {!archivedLoading && !archivedErr && paged.map(
                            (r, idx) => {
                              const studentIdValue = r.studentId ?? "—";
                              const deviceValue = r.deviceId ?? "—";
                              const emailValue = r.email ?? "—";

                              return (
                                <div
                                  className="rep-dt-row"
                                  key={(r.kind || "") + (r.studentId || r.profId || "") + idx}
                                  style={{ gridTemplateColumns: rowGrid }}
                                >
                                  {isAll && <div className="rep-typeCell">{r.kind}</div>}

                                  <div className="rep-dt-nameCell">
                                    <span className="rep-dt-avatar">{initials(r.name)}</span>
                                    <div className="rep-dt-name">{r.name}</div>
                                  </div>

                                  {isStudent ? (
                                    <div className="rep-email">{studentIdValue}</div>
                                  ) : (
                                    <div className="rep-email">{emailValue}</div>
                                  )}

                                  {isStudent && <div>{deviceValue}</div>}

                                  {isStudent && <div className="rep-email">{emailValue}</div>}

                                  <div>{r.deletedAt}</div>

                                  <div>
                                    <button className="rep-restoreBtn" type="button" onClick={() => openRestore(r)}>
                                      Restore
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Pagination */}
            <div className="rep-dt-pagination">
              <button
                className="rep-dt-pageBtn"
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹ Previous
              </button>

              <button className="rep-dt-pageNum active" type="button">
                {safePage}
              </button>

              <button
                className="rep-dt-pageBtn"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      </main>

      <ActivityHistoryModal open={activityOpen} onClose={() => setActivityOpen(false)} items={activity} anchorRect={activityAnchorRect} />

      {/* Restore confirm */}
      <ConfirmModal
        open={restoreOpen}
        title={restoreTarget ? `Restore ${restoreTarget.kind}: ${restoreTarget.name}?` : "Restore this account?"}
        onYes={confirmRestore}
        onCancel={() => {
          setRestoreOpen(false);
          setRestoreTarget(null);
        }}
      />

      {/* ✅ Restore result modal (success/error) */}
      <SuccessModal
        open={successOpen}
        message={successMsg}
        onClose={() => setSuccessOpen(false)}
      />

      {/* ✅ Feedback status change confirm */}
      <ConfirmModal
        open={fbStatusConfirmOpen}
        title={`Change status from "${fbPrevStatus}" to "${fbNextStatus}"?`}
        onYes={confirmFeedbackStatusChange}
        onCancel={cancelFeedbackStatusChange}
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

function initials(name) {
  const parts = String(name || "").split(" ").filter(Boolean);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return (a + b) || "U";
}
