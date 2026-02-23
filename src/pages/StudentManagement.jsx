import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./StudentManagement.css";
import AddStudentModal from "../components/AddStudentModal";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditStudentModal from "../components/EditStudentModal";
import supabase from "../helper/supabaseClient";
import { sendStudentInvite } from "../helper/emailjs";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

/* ===== Font Awesome ===== */
import { 
  FontAwesomeIcon 
} from "@fortawesome/react-fontawesome";
import { 
  faBell, 
  faMagnifyingGlass, 
  faPlus, 
  faDownload, 
  faPenToSquare, 
  faArchive,
  faChevronLeft,
  faChevronRight 
} from "@fortawesome/free-solid-svg-icons";

const ALLOWED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.com.ph",
  "outlook.com",
  "hotmail.com",
  "msn.com",
]);

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const validateInviteEmail = (value) => {
  const email = String(value || "").trim().toLowerCase();
  if (!email) return "Please enter an email address.";
  if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address.";
  const domain = email.split("@")[1] || "";
  if (!ALLOWED_EMAIL_DOMAINS.has(domain)) {
    return "Only gmail.com, yahoo.com, yahoo.com.ph, outlook.com, hotmail.com, and msn.com are allowed.";
  }
  return "";
};

export default function StudentManagement() {
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

  // ===== Filters =====
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);

  // ===== Modals/Status States =====
  const [addOpen, setAddOpen] = useState(false);
  const [selectMethodOpen, setSelectMethodOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [pendingEdit, setPendingEdit] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [unbindConfirmOpen, setUnbindConfirmOpen] = useState(false);
  const [pendingUnbind, setPendingUnbind] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [unbinding, setUnbinding] = useState(false);

  // ===== Data States =====
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

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
        email,
        mac_address,
        class_enrollments:class_enrollments(count)
      `)
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Fetch students error:", error.message);
      setRows([]);
    } else {
      const mapped = (data || []).map((s) => ({
        uuid: s.id,
        name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.replace(/\s+/g, " ").trim(),
        email: s.email ?? "",
        studentId: (s.student_number ?? "").toString(),
        classes: Number(s.class_enrollments?.[0]?.count ?? 0),
        status: s.status ?? "Active",
        macAddress: s.mac_address ?? null,
        deviceText: s.mac_address ? "Device Active" : "No Device Found",
        deviceBound: Boolean(s.mac_address),
      }));
      setRows(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ===== ACTIONS =====
  const onAdd = () => setSelectMethodOpen(true);

  const handleStudentAdded = ({ studentRow, displayName, studentNumber }) => {
    fetchStudents(); // Refresh from DB to be sure
    setAddOpen(false);
    setSuccessMsg(`Student added: ${displayName} (${studentNumber})`);
    setSuccessOpen(true);
    setTimeout(() => setSuccessOpen(false), 2500);
  };

  const handleInviteSend = (email) => {
    setInviteOpen(false);
    setSuccessMsg(`Invite sent to ${email}`);
    setSuccessOpen(true);
    setTimeout(() => setSuccessOpen(false), 2500);
  };

  const onEdit = (student) => {
    setEditingStudent(student);
    setEditOpen(true);
  };

  const onEditSaveClick = (updatedStudent) => {
    setPendingEdit(updatedStudent);
    setApplyOpen(true);
  };

  const applyYes = async () => {
    if (savingEdit || !pendingEdit?.uuid) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ status: pendingEdit.status })
        .eq("id", pendingEdit.uuid);

      if (error) throw error;

      setRows((prev) =>
        prev.map((s) => (s.uuid === pendingEdit.uuid ? { ...s, ...pendingEdit } : s))
      );
      setApplyOpen(false);
      setEditOpen(false);
      setSuccessMsg(`Updated student: ${pendingEdit.name}`);
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } catch (err) {
      console.error(err.message);
    } finally {
      setSavingEdit(false);
      setPendingEdit(null);
      setEditingStudent(null);
    }
  };

  const onDeleteClick = (student) => {
    setPendingDelete(student);
    setDeleteOpen(true);
  };

  const onUnbindRequest = (student) => {
    setPendingUnbind(student);
    setUnbindConfirmOpen(true);
  };

  const deleteYes = async () => {
    if (deleting || !pendingDelete?.uuid) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ archived: true, status: "Inactive" })
        .eq("id", pendingDelete.uuid);

      if (error) throw error;

      setRows((prev) => prev.filter((s) => s.uuid !== pendingDelete.uuid));
      setDeleteOpen(false);
      setSuccessMsg(`Student archived: ${pendingDelete.name}`);
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } catch (err) {
      console.error(err.message);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const unbindYes = async () => {
    if (unbinding || !pendingUnbind?.uuid) return;
    if (!pendingUnbind.macAddress) {
      setUnbindConfirmOpen(false);
      setPendingUnbind(null);
      return;
    }

    setUnbinding(true);
    try {
      const { error: deviceByMacError } = await supabase
        .from("devices")
        .delete()
        .eq("mac_address", pendingUnbind.macAddress);

      if (deviceByMacError) throw deviceByMacError;

      const { error: studentError } = await supabase
        .from("students")
        .update({ mac_address: null })
        .eq("id", pendingUnbind.uuid);

      if (studentError) throw studentError;

      setRows((prev) =>
        prev.map((s) =>
          s.uuid === pendingUnbind.uuid
            ? {
                ...s,
                macAddress: null,
                deviceText: "No Device Found",
                deviceBound: false,
              }
            : s
        )
      );
      setEditingStudent((prev) =>
        prev?.uuid === pendingUnbind.uuid
          ? {
              ...prev,
              macAddress: null,
              deviceText: "No Device Found",
              deviceBound: false,
            }
          : prev
      );
      setUnbindConfirmOpen(false);
      setSuccessMsg(`Device unbound: ${pendingUnbind.name}`);
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } catch (err) {
      console.error("Failed to unbind device:", err.message);
    } finally {
      setUnbinding(false);
      setPendingUnbind(null);
    }
  };

  // ===== FILTERING & PAGINATION =====
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((s) => {
      const matchesQuery = !query || s.name.toLowerCase().includes(query) || s.studentId.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All Status" || s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, q, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entries));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * entries;
    return filtered.slice(start, start + entries);
  }, [filtered, safePage, entries]);

  const showingFrom = (safePage - 1) * entries + (pageRows.length ? 1 : 0);
  const showingTo = (safePage - 1) * entries + pageRows.length;

  useEffect(() => { setPage(1); }, [q, statusFilter, entries]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((s) => s.status === "Active").length,
      inactive: rows.filter((s) => s.status === "Inactive").length,
    };
  }, [rows]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Management');

    // 1. Define Columns (5 Columns lang based sa image: A to E)
    worksheet.columns = [
      { key: 'name', width: 30 },       // A: Student Name
      { key: 'email', width: 35 },      // B: Email (mas malapad usually)
      { key: 'studentId', width: 20 },  // C: Student Id
      { key: 'classes', width: 20 },    // D: Classes
      { key: 'status', width: 12 }      // E: Status
    ];

    // 2. INSERT LOGO
    try {
      const response = await fetch('/Logo.png'); // Nasa public folder dapat
      const buffer = await response.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: buffer,
        extension: 'png',
      });
      
      // I-center natin visually sa ibabaw (Columns B-D)
      worksheet.addImage(imageId, {
        tl: { col: 1.9, row: 0 }, 
        ext: { width: 292.15748031, height: 100.15748031 }
      });
    } catch (error) {
      console.warn('Logo loading failed', error);
    }

    // 3. TITLE & DATE (Row 6 & 7)
    
    // Title
    const titleRow = worksheet.getRow(6);
    titleRow.values = ['STUDENT MANAGEMENT'];
    worksheet.mergeCells('A6:E6'); // Merge A to E only
    titleRow.getCell(1).font = { name: 'Calibri', size: 14, bold: true };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Date
    const dateRow = worksheet.getRow(7);
    const now = new Date();
    dateRow.values = [`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`];
    worksheet.mergeCells('A7:E7'); // Merge A to E only
    dateRow.getCell(1).font = { name: 'Calibri', size: 10 };
    dateRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 4. TABLE HEADER (Row 9)
    const headerRow = worksheet.getRow(9);
    headerRow.values = ["Student Name", "Email", "Student Id", "Classes", "Status"];
    
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

    // 5. DATA ROWS (Loop sa 'filtered')
    filtered.forEach((s) => {
      const row = worksheet.addRow([
        s.name, 
        s.email, 
        s.studentId, 
        s.classes, 
        s.status
      ]);

      // Styling per cell
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Alignment formatting
        // Name (Col 1) & Email (Col 2) = Left Align
        // Others = Center Align
        if (colNumber === 1 || colNumber === 2) {
             cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        } else {
             cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // 6. PRINT SETUP (Fit to Page)
    worksheet.pageSetup.printArea = `A1:E${worksheet.lastRow.number}`;
    worksheet.pageSetup.orientation = 'landscape'; 
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1; // Sakto sa lapad ng papel
    worksheet.pageSetup.fitToHeight = 0; // Tuloy-tuloy pababa pag madaming data

    // 7. Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Student_List.xlsx');
  };

  return (
    <div className="app-shell sm">
      <Sidebar open={false} active="dashboard" />

      {/* Topbar */}
      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="mnt-topbar-left">
            <button type="button" className="sm-back-btn" onClick={() => navigate(-1)} aria-label="Back" title="Back">
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <div>
              <div className="mnt-title">Student Management</div>
              <div className="pm-subtitle">Review list of students</div>
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

      <main className="sm-main">
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

        <section className="sm-card">
          <div className="sm-filters">
            <div className="sm-controls">
              <div className="sm-controls-left">
                <div className="sm-searchBox">
                  <span className="sm-searchIcon"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
                </div>
                <div className="sm-statusFilter">
                  <div className="sm-statusLabel">Status</div>
                  <select className="sm-statusSelect" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option>All Status</option><option>Active</option><option>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="sm-controls-right">
                <button className="sm-addTopBtn" onClick={onAdd}>
                  <FontAwesomeIcon icon={faPlus} /> Add Student
                </button>
                <button className="sm-exportTopBtn" onClick={exportToExcel}>
                  <FontAwesomeIcon icon={faDownload} /> Export XLSX
                </button>
              </div>
            </div>
            <div className="sm-strip">
              <div className="sm-stripLeft">
                <div className="sm-entries">
                  <span>Show</span>
                  <select value={entries} onChange={(e) => setEntries(Number(e.target.value))}>
                    <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option>
                  </select>
                  <span>entries</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sm-tableWrap">
            <table className="sm-table2">
              <thead>
                <tr>
                  <th>Student Name</th><th>Email</th><th>Student ID</th><th>Classes</th><th>Device</th><th className="sm-th-center">Status</th><th className="sm-actionsHead">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="sm-emptyRow" colSpan={7}>Loading students...</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td className="sm-emptyRow" colSpan={7}>No students found.</td></tr>
                ) : (
                  pageRows.map((s) => (
                    <tr key={s.uuid}>
                      <td className="sm-nameTd">
                        <span className="sm-avatar">{initials(s.name)}</span>
                        <span className="sm-nameText">{s.name}</span>
                      </td>
                      <td>{s.email || "—"}</td>
                      <td>{s.studentId}</td>  <td>{s.classes}</td>
                      <td className="sm-deviceTd">
                        <span className={`sm-deviceStatus ${s.deviceBound ? "bound" : "unbound"}`}>{s.deviceText}</span>
                      </td>
                      <td className="sm-td-center">
                        <span className={`sm-status ${s.status === "Active" ? "active" : "inactive"}`}>{s.status}</span>
                      </td>
                      <td className="sm-actionsCell">
                        <button className="sm-action edit" onClick={() => onEdit(s)}><FontAwesomeIcon icon={faPenToSquare} /> Edit</button>
                        <button className="sm-action del" onClick={() => onDeleteClick(s)}><FontAwesomeIcon icon={faArchive} /> Archive</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sm-footer">
            <div className="sm-footerLeft">Showing {showingFrom} to {showingTo} of {filtered.length} entries</div>
            <div className="sm-footerRight">
              <button className="sm-footerBtn" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}><FontAwesomeIcon icon={faChevronLeft} /> Previous</button>
              <span className="sm-footerPage">{safePage}</span>
              <button className="sm-footerBtn" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>Next <FontAwesomeIcon icon={faChevronRight} /></button>
            </div>
          </div>
        </section>
      </main>

      <AddStudentModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleStudentAdded} />
      <SelectCreationMethodModal
        open={selectMethodOpen}
        onClose={() => setSelectMethodOpen(false)}
        onSelectManual={() => {
          setSelectMethodOpen(false);
          setAddOpen(true);
        }}
        onSelectInvite={() => {
          setSelectMethodOpen(false);
          setInviteOpen(true);
        }}
      />
      <InviteStudentModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSend={handleInviteSend}
      />
      <EditStudentModal
        open={editOpen}
        student={editingStudent}
        onClose={() => setEditOpen(false)}
        onSaveClick={onEditSaveClick}
        onUnbindRequest={onUnbindRequest}
      />
      
      {successOpen && (
        <div className="scm-overlay"><div className="scm-card"><i className="bx bx-check-circle"></i><p className="scm-text">{successMsg}</p></div></div>
      )}

      <SmallConfirmModal open={applyOpen} title={savingEdit ? "Saving..." : "Apply Changes?"} onYes={applyYes} onCancel={() => setApplyOpen(false)} />
      <SmallConfirmModal open={deleteOpen} title={deleting ? "Archiving..." : `Archive ${pendingDelete?.name}?`} onYes={deleteYes} onCancel={() => setDeleteOpen(false)} />
      <SmallConfirmModal
        open={unbindConfirmOpen}
        title={unbinding ? "Unbinding..." : `Unbind device for ${pendingUnbind?.name}?`}
        onYes={unbindYes}
        onCancel={() => {
          if (unbinding) return;
          setUnbindConfirmOpen(false);
          setPendingUnbind(null);
        }}
      />

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

function initials(name) {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "U";
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function SelectCreationMethodModal({ open, onClose, onSelectManual, onSelectInvite }) {
  if (!open) return null;
  return (
    <div className="scm-overlay" onClick={onClose}>
      <div className="sm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sm-modal-title">How do you want to add a new student?</div>
        <div className="sm-modal-actions">
          <button className="sm-modal-btn secondary" onClick={onSelectManual}>
            Create Manually
          </button>
          <button className="sm-modal-btn" onClick={onSelectInvite}>
            Invite via Email Link
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteStudentModal({ open, onClose, onSend }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const formatInviteError = (err, fallbackEmail = "") => {
    const text = [err?.details, err?.message, err?.hint].filter(Boolean).join(" ");
    const matched = text.match(/Key \(email\)=\(([^)]+)\) already exists\.?/i);
    if (matched?.[1]) return `Key (email)=(${matched[1]}) already exists.`;
    if (/duplicate key value/i.test(text) || (/already exists/i.test(text) && /email/i.test(text))) {
      return `Key (email)=(${fallbackEmail}) already exists.`;
    }
    return err?.details || err?.message || "Failed to send invite.";
  };
  const resetInviteForm = () => {
    setEmail("");
    setFieldError("");
    setSending(false);
  };
  const handleClose = () => {
    resetInviteForm();
    onClose?.();
  };

  useEffect(() => {
    if (!open) resetInviteForm();
  }, [open]);

  const handleSend = async () => {
    const clientError = validateInviteEmail(email);
    if (sending || clientError) {
      setFieldError(clientError || "Please enter a valid email address.");
      return;
    }

    setFieldError("");
    setSending(true);
    try {
      const emailLower = email.trim().toLowerCase();

      const [{ data: existingAdmin, error: adminErr }, { data: existingProfessor, error: professorErr }, { data: existingStudent, error: studentErr }] = await Promise.all([
        supabase.from("admins").select("id").eq("username", emailLower).maybeSingle(),
        supabase.from("professors").select("id").eq("email", emailLower).maybeSingle(),
        supabase.from("students").select("id").eq("email", emailLower).maybeSingle(),
      ]);

      if (adminErr || professorErr || studentErr) {
        throw new Error(adminErr?.message || professorErr?.message || studentErr?.message || "Failed to validate email");
      }

      if (existingAdmin || existingProfessor || existingStudent) {
        throw new Error("Email is already registered.");
      }

      const { data, error } = await supabase.rpc("create_user_invite", {
        invitee_email: emailLower,
        invite_user_type: "student",
      });

      if (error) throw new Error(formatInviteError(error, emailLower));

      const token =
        typeof data === "string"
          ? data
          : data?.token || data?.invite_token || data?.id || "";

      const baseUrl =
        import.meta.env.VITE_APP_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const inviteLink = token ? `${baseUrl}/register?token=${token}&role=student` : "";

      if (!inviteLink) {
        throw new Error("Invite link was not returned from the server.");
      }

      await sendStudentInvite(emailLower, inviteLink);
      resetInviteForm();
      onSend(emailLower);
    } catch (err) {
      console.error("Failed to send student invite:", err);
      setFieldError(formatInviteError(err, email.trim().toLowerCase()));
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="scm-overlay" onClick={handleClose}>
      <div className="sm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sm-modal-title">Send Student Invitation</div>
        <label className="sm-modal-label">Email Address</label>
        <input
          type="email"
          className="sm-modal-input"
          placeholder="student.email@example.com"
          value={email}
          onChange={(e) => {
            const nextEmail = e.target.value;
            setEmail(nextEmail);
            setFieldError(validateInviteEmail(nextEmail));
          }}
          disabled={sending}
        />
        {fieldError && <div className="sm-modal-error">{fieldError}</div>}
        <button
          className={`sm-modal-btn sm-modal-send ${!email || sending || Boolean(validateInviteEmail(email)) ? "disabled" : ""}`}
          type="button"
          disabled={!email || sending || Boolean(validateInviteEmail(email))}
          onClick={handleSend}
        >
          {sending ? "Sending..." : "Send Invite"}
        </button>
      </div>
    </div>
  );
}
