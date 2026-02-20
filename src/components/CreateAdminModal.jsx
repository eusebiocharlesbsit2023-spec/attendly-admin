import React, { useMemo, useState } from "react";
import "./CreateAdminModal.css";

/* FontAwesome (eye icons) */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import supabase from "../helper/supabaseClient";
import SmallConfirmModal from "../components/SmallConfirmModal";

const NAME_REGEX = /^[A-Za-z\s]+$/;
const EMAIL_FORMAT_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
const ALLOWED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.com.ph",
  "outlook.com",
  "hotmail.com",
  "msn.com",
]);

function validateEmail(emailRaw) {
  const value = (emailRaw || "").trim().toLowerCase();
  if (!value) return "Email is required";
  if (!EMAIL_FORMAT_REGEX.test(value)) return "Enter a valid email address";

  const at = value.lastIndexOf("@");
  const domain = value.slice(at + 1);
  if (!ALLOWED_EMAIL_DOMAINS.has(domain)) {
    return "Use a supported email provider (e.g., gmail.com, yahoo.com, outlook.com).";
  }

  return "";
}

function generateStrongPassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*_-+=";

  const all = upper + lower + digits + symbols;

  // ensure at least one from each set
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);

  for (let i = pwd.length; i < length; i++) pwd += pick(all);

  // shuffle
  pwd = pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return pwd;
}

export default function CreateAdminModal({ open, onClose, onCreate }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("Admin");
  const [tempPassword, setTempPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changed, setChanged] = useState({
    firstName: false,
    lastName: false,
    email: false,
    tempPassword: false,
  });

  const errors = useMemo(() => {
    const e = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    else if (!NAME_REGEX.test(firstName.trim())) e.firstName = "First name must contain letters only";
    if (!lastName.trim()) e.lastName = "Last name is required";
    else if (!NAME_REGEX.test(lastName.trim())) e.lastName = "Last name must contain letters only";
    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;
    if (!tempPassword.trim()) e.tempPassword = "Temporary password is required";
    if (tempPassword.trim() && tempPassword.trim().length < 6)
      e.tempPassword = "Min 6 characters";
    return e;
  }, [firstName, lastName, email, tempPassword]);


  const canSubmit = Object.keys(errors).length === 0;

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole("Admin");
    setTempPassword("");
    setShowPass(false);
    setChanged({ firstName: false, lastName: false, email: false, tempPassword: false });
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleGeneratePassword = async () => {
    const p = generateStrongPassword(8);
    setTempPassword(p);
    setChanged((c) => ({ ...c, tempPassword: true }));

    try {
      await navigator.clipboard.writeText(p);
    } catch {
      // ignore if clipboard blocked
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    const emailErr = validateEmail(email);
    if (emailErr) {
      setChanged((c) => ({ ...c, email: true }));
      return;
    }
    if (!canSubmit) return;
    try {
      const emailLower = email.trim().toLowerCase();
      const { data: existingAdmin, error: adminErr } = await supabase
        .from("admins")
        .select("id, username")
        .eq("username", emailLower)
        .maybeSingle();

      if (adminErr) throw adminErr;
      if (existingAdmin) {
        setErrorMessage("Email is already registered as an admin.");
        return;
      }

      const [studentRes, profRes] = await Promise.all([
        supabase.from("students").select("id").eq("email", emailLower).maybeSingle(),
        supabase.from("professors").select("id").eq("email", emailLower).maybeSingle(),
      ]);

      if (studentRes.error) throw studentRes.error;
      if (profRes.error) throw profRes.error;
      if (studentRes.data || profRes.data) {
        setErrorMessage("Email is already registered.");
        return;
      }

      setConfirmOpen(true);
    } catch (err) {
      setErrorMessage(`Check failed: ${err.message || err}`);
    }
  };

  const confirmYes = async () => {
    if (submitting) return;
    setConfirmOpen(false);
    setSubmitting(true);
    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      temp_password: tempPassword,
      role: "Admin",
      status: "Active",
    };

    const { data, error } = await supabase.functions.invoke("create-admin-and-email", {
      body: payload,
    });

    if (error) {
      const res = error.context?.response;
      setErrorMessage(res ? await res.text() : error.message);
      setSubmitting(false);
      return;
    }

    if (!data?.success) {
      setErrorMessage(`${data?.step ?? "error"}: ${data?.message ?? "Unknown error"}`);
      setSubmitting(false);
      return;
    }

    onCreate?.({
      uuid: data.admin.id,
      fullName: data.admin.admin_name,
      username: data.admin.username,
      role: data.admin.role,
      status: data.admin.status,
    });

    handleClose();

    reset();
    onClose?.();
    setSubmitting(false);
  };


  if (!open) return null;

  return (
    <div className="cam-overlay" onMouseDown={handleClose}>
      <SmallConfirmModal
        open={confirmOpen}
        title={submitting ? "Adding..." : `Add admin ${firstName.trim()} ${lastName.trim()}?`}
        onYes={confirmYes}
        onCancel={() => setConfirmOpen(false)}
      />
      <div className="cam-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cam-title">Create New Admin</div>

        <form onSubmit={handleSubmit} className="cam-form">
          <p className="error-text">{errorMessage}</p>

          <label className="cam-label">
            First Name <span className="cam-req">*</span>
          </label>
          <input
            className={`cam-input ${(changed.firstName && errors.firstName) ? "err" : ""}`}
            value={firstName}
            onChange={(e) => { setChanged((c) => ({ ...c, firstName: true })); setFirstName(e.target.value.replace(/[^A-Za-z\s]/g, "")); }}
          />
          {changed.firstName && errors.firstName && <div className="cam-error">{errors.firstName}</div>}

          <label className="cam-label">
            Last Name <span className="cam-req">*</span>
          </label>
          <input
            className={`cam-input ${(changed.lastName && errors.lastName) ? "err" : ""}`}
            value={lastName}
            onChange={(e) => { setChanged((c) => ({ ...c, lastName: true })); setLastName(e.target.value.replace(/[^A-Za-z\s]/g, "")); }}
          />
          {changed.lastName && errors.lastName && <div className="cam-error">{errors.lastName}</div>}

          {/* Username */}
          <label className="cam-label">
            Email <span className="cam-req">*</span>
          </label>
          <input
            type="email"
            className={`cam-input ${(changed.email && errors.email) ? "err" : ""}`}
            value={email}
            onChange={(e) => { setChanged((c) => ({ ...c, email: true })); setEmail(e.target.value); }}
          />
          {changed.email && errors.email && <div className="cam-error">{errors.email}</div>}

          {/* Role (Admin only) */}
          <label className="cam-label">Role</label>
          <select className="cam-input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Admin">Admin</option>
          </select>

          {/* Temporary Password */}
          <label className="cam-label">
            Temporary Password <span className="cam-req">*</span>
          </label>

          <div style={{ display: "grid", gap: 8 }}>
            <div className={`cam-passWrap ${(changed.tempPassword && errors.tempPassword) ? "err" : ""}`}>
              <input
                className="cam-pass"
                type={'text'}
                placeholder="Enter Temporary Password"
                value={tempPassword}
                onChange={(e) => { setChanged((c) => ({ ...c, tempPassword: true })); setTempPassword(e.target.value); }}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="cam-btn"
                onClick={handleGeneratePassword}
                style={{ flex: 1 }}
              >
                Generate Password
              </button>
            </div>
          </div>

          {changed.tempPassword && errors.tempPassword && (
            <div className="cam-error">{errors.tempPassword}</div>
          )}

          {/* Buttons */}
          <div className="cam-actions">
            <button type="submit" className="cam-btn primary" disabled={!canSubmit || submitting}>
              {submitting ? "Adding..." : "Add"}
            </button>
            <button type="button" className="cam-btn" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
