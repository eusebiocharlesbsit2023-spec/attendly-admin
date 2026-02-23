import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ActivityHistoryModal from "../components/ActivityHistoryModal";
import "./ProfessorManagement.css";
import AddProfessorModal from "../components/AddProfessorModal";
import SmallConfirmModal from "../components/SmallConfirmModal";
import EditProfessorModal from "../components/EditProfessorModal";
import supabase from "../helper/supabaseClient";
import { sendProfessorInvite } from "../helper/emailjs";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/* ✅ Import the reusable hook */
import { useNotifications } from "../hooks/useNotifications";

/* ===== Font Awesome ===== */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faMagnifyingGlass,
  faPlus,
  faDownload,
  faPenToSquare,
  faChevronLeft,
  faChevronRight,
  faArchive,
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

export default function ProfessorManagement() {
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

  // Search + pagination states
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);

  // Data states
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]); 

  const fetchProfessors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("professors")
        .select(`
          id,
          professor_name,
          email,
          department,
          status,
          archived,
          classes:classes(count)
        `)
        .eq("archived", false) 
        .order("professor_name", { ascending: true });

      if (error) throw error;

      setRows(
        (data || []).map((p) => ({
          id: p.id,
          name: p.professor_name,
          email: p.email,
          department: p.department,
          status: p.status ?? "Active",
          classes: Number(p.classes?.[0]?.count ?? 0),
        }))
      );
    } catch (err) {
      console.error("fetchProfessors error:", err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  // Modals / Action states
  const [addOpen, setAddOpen] = useState(false);
  const [selectMethodOpen, setSelectMethodOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);  
  const [pendingEdit, setPendingEdit] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProf, setEditingProf] = useState(null);

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

  // Handlers
  const onAdd = () => setSelectMethodOpen(true);
  const handleAddSubmit = async () => {
    setAddOpen(false);
    setSuccessMsg("Professor added successfully!");
    setSuccessOpen(true);
    await fetchProfessors();
  };
  const handleInviteSend = (email) => {
    setInviteOpen(false);
    setSuccessMsg(`Invite sent to ${email}`);
    setSuccessOpen(true);
  };

  const onEdit = (profObj) => {
    setEditingProf(profObj);
    setEditOpen(true);
  };

  const onEditSaveClick = (updatedProf) => {
    setPendingEdit(updatedProf);
    setApplyOpen(true);
  };

  const applyYes = async () => {
    if (!pendingEdit?.id) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("professors")
        .update({
          professor_name: pendingEdit.name,
          email: pendingEdit.email,
          department: pendingEdit.department,
          status: pendingEdit.status,
        })
        .eq("id", pendingEdit.id);

      if (error) throw error;

      setApplyOpen(false);
      setEditOpen(false);
      setSuccessMsg("Professor updated successfully!");
      setSuccessOpen(true);
      await fetchProfessors();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const onArchiveClick = (profObj) => {
    setPendingDelete(profObj);
    setDeleteOpen(true);
  };

  const archiveYes = async () => {
    if (!pendingDelete?.id) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("professors")
        .update({ archived: true, status: "Inactive" })
        .eq("id", pendingDelete.id);

      if (error) throw error;

      setDeleteOpen(false);
      setSuccessMsg("Professor archived successfully!");
      setSuccessOpen(true);
      await fetchProfessors();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Logic: Filtering & Pagination
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((p) => p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query));
  }, [rows, q]);

  useEffect(() => { setPage(1); }, [q, entries]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entries));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * entries;
    return filtered.slice(start, start + entries);
  }, [filtered, safePage, entries]);

  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * entries + 1;
  const showingTo = Math.min(filtered.length, (safePage - 1) * entries + paged.length);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((p) => p.status === "Active").length,
      inactive: rows.filter((p) => p.status === "Inactive").length,
    };
  }, [rows]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Professor Management');

    // 1. Define Columns (4 Columns: A to D)
    worksheet.columns = [
      { key: 'name', width: 30 },     // A: Professor Name
      { key: 'email', width: 35 },    // B: Email
      { key: 'classes', width: 25 },  // C: Classes
      { key: 'status', width: 12 }    // D: Status
    ];

    // 2. INSERT LOGO
    try {
      const response = await fetch('/Logo.png'); // Nasa public folder
      const buffer = await response.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: buffer,
        extension: 'png',
      });
      
      // Center visually: Target Columns B & C roughly
      worksheet.addImage(imageId, {
        tl: { col: 1.2, row: 0 }, // Start slightly inside Column B
        ext: { width: 292.15748031, height: 100.15748031 }
      });
    } catch (error) {
      console.warn('Logo loading failed', error);
    }

    // 3. TITLE & DATE (Row 6 & 7)
    
    // Title
    const titleRow = worksheet.getRow(6);
    titleRow.values = ['PROFESSOR MANAGEMENT'];
    worksheet.mergeCells('A6:D6'); // Merge A to D (4 columns lang)
    titleRow.getCell(1).font = { name: 'Calibri', size: 14, bold: true };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Date
    const dateRow = worksheet.getRow(7);
    const now = new Date();
    dateRow.values = [`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`];
    worksheet.mergeCells('A7:D7'); // Merge A to D
    dateRow.getCell(1).font = { name: 'Calibri', size: 10 };
    dateRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 4. TABLE HEADER (Row 9)
    const headerRow = worksheet.getRow(9);
    headerRow.values = ["Professor Name", "Email", "Classes", "Status"];
    
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
    filtered.forEach((p) => {
      const row = worksheet.addRow([
        p.name, 
        p.email, 
        p.classes, 
        p.status
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
        // Name (Col 1) & Email (Col 2) = Left Align (standard for text)
        // Classes (Col 3) = Center (or Left kung mahaba ang listahan ng classes)
        // Status (Col 4) = Center
        if (colNumber === 1 || colNumber === 2) {
             cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        } else {
             cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // 6. PRINT SETUP
    worksheet.pageSetup.printArea = `A1:D${worksheet.lastRow.number}`;
    worksheet.pageSetup.orientation = 'landscape'; // O 'portrait' kung gusto mo dahil 4 cols lang naman
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1; // Susi para fit sa lapad
    worksheet.pageSetup.fitToHeight = 0; 

    // 7. Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Professor_List.xlsx');
  };

  return (
    <div className="app-shell pm">
      <Sidebar open={false} active="dashboard" />

      <header className="mnt-topbar">
        <div className="mnt-topbar-inner">
          <div className="pm-topbar-left">
            <button type="button" className="pm-back-btn" onClick={() => navigate(-1)} aria-label="Back" title="Back">
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <div>
              <div className="pm-title">Professor Management</div>
              <div className="pm-subtitle">Review list of professors</div>
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

      <main className="pm-main">
        <section className="pm-stats">
          <div className="pm-stat pm-stat-white">
            <div className="pm-stat-label">Total Professors</div>
            <div className="pm-stat-value">{stats.total}</div>
          </div>
          <div className="pm-stat pm-stat-green">
            <div className="pm-stat-label">Active</div>
            <div className="pm-stat-value">{stats.active}</div>
          </div>
          <div className="pm-stat pm-stat-red">
            <div className="pm-stat-label">Inactive</div>
            <div className="pm-stat-value">{stats.inactive}</div>
          </div>
        </section>

        <section className="pm-card">
          <div className="pm-controls">
            <div className="pm-controls-left">
              <div className="pm-searchBox">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
                <span className="pm-searchIcon"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
              </div>
              <div className="pm-entriesInline">
                <span className="pm-entriesLabel">Show</span>
                <select value={entries} onChange={(e) => setEntries(Number(e.target.value))}>
                  <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option>
                </select>
                <span className="pm-entriesLabel">entries</span>
              </div>
            </div>
            <div className="pm-controls-right">
              <button className="pm-addBtn" onClick={onAdd}><FontAwesomeIcon icon={faPlus} /> Add Professor</button>
              <button className="pm-exportBtn" onClick={exportToExcel}><FontAwesomeIcon icon={faDownload} /> Export XLSX</button>
            </div>
          </div>

          <div className="pm-tableWrap">
            <table className="pm-tableReal">
              <thead>
                <tr>
                  <th>Professor Name</th><th>Email</th><th>Classes</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="pm-emptyCell">Loading professors...</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan="5" className="pm-emptyCell">No professors found.</td></tr>
                ) : (
                  paged.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="pm-nameCell">
                          <span className="pm-avatar">{initials(p.name)}</span>
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="pm-email">{p.email}</td>
                      <td>{p.classes}</td>
                      <td><span className={`pm-pill ${p.status === "Active" ? "active" : "inactive"}`}>{p.status}</span></td>
                      <td>
                        <div className="pm-actionCell">
                          <button className="pm-actionBtn edit" onClick={() => onEdit(p)}><FontAwesomeIcon icon={faPenToSquare} /> Edit</button>
                          <button className="pm-actionBtn del" onClick={() => onArchiveClick(p)}><FontAwesomeIcon icon={faArchive} /> Archive</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="pm-footer">
              <div className="pm-footerLeft">Showing {showingFrom} to {showingTo} of {filtered.length} entries</div>
              <div className="pm-footerRight">
                <button className="pm-pageBtn" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}><FontAwesomeIcon icon={faChevronLeft} /> Previous</button>
                <button className="pm-pageNum active">{safePage}</button>
                <button className="pm-pageBtn" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>Next <FontAwesomeIcon icon={faChevronRight} /></button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AddProfessorModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddSubmit} />
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
      <InviteProfessorModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSend={handleInviteSend}
      />
      <EditProfessorModal open={editOpen} professor={editingProf} onClose={() => setEditOpen(false)} onSaveClick={onEditSaveClick} />
      <SuccessModal open={successOpen} message={successMsg} onClose={() => setSuccessOpen(false)} />
      <SmallConfirmModal open={applyOpen} title={actionLoading ? "Applying..." : "Apply Changes?"} onYes={applyYes} onCancel={() => setApplyOpen(false)} />
      <SmallConfirmModal open={deleteOpen} title={actionLoading ? "Archiving..." : `Archive ${pendingDelete?.name}?`} onYes={archiveYes} onCancel={() => setDeleteOpen(false)} />

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
      <div className="pm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-title">How do you want to add a new professor?</div>
        <div className="pm-modal-actions">
          <button className="pm-modal-btn secondary" onClick={onSelectManual}>
            Create Manually
          </button>
          <button className="pm-modal-btn" onClick={onSelectInvite}>
            Invite via Email Link
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteProfessorModal({ open, onClose, onSend }) {
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
        invite_user_type: "professor",
      });

      if (error) throw new Error(formatInviteError(error, emailLower));

      const token =
        typeof data === "string"
          ? data
          : data?.token || data?.invite_token || data?.id || "";
      const baseUrl =
        import.meta.env.VITE_APP_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const inviteLink = token ? `${baseUrl}/register?token=${token}&role=professor` : "";

      if (!inviteLink) {
        throw new Error("Invite link was not returned from the server.");
      }

      await sendProfessorInvite(emailLower, inviteLink);
      resetInviteForm();
      onSend(emailLower);
    } catch (err) {
      console.error("Failed to send professor invite:", err);
      setFieldError(formatInviteError(err, email.trim().toLowerCase()));
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="scm-overlay" onClick={handleClose}>
      <div className="pm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-title">Send Professor Invitation</div>
        <label className="pm-modal-label">Email Address</label>
        <input
          type="email"
          className="pm-modal-input"
          placeholder="prof.email@example.com"
          value={email}
          onChange={(e) => {
            const nextEmail = e.target.value;
            setEmail(nextEmail);
            setFieldError(validateInviteEmail(nextEmail));
          }}
          disabled={sending}
        />
        {fieldError && <div className="pm-modal-error">{fieldError}</div>}
        <button
          className={`pm-modal-btn pm-modal-send ${!email || sending || Boolean(validateInviteEmail(email)) ? "disabled" : ""}`}
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
