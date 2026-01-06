import React, { useEffect, useMemo, useState } from "react";
import "./AddProfessorModal.css";

/* PASSWORD RULES:
   - at least 8 chars
   - exactly 1 special char
   - exactly 2 digits
*/

/* PASSWORD GENERATOR that follows rules */
function generateStrongPassword(length = 10) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*_-+=?";

  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  const minLen = Math.max(8, length);

  let pwd = "";
  pwd += pick(upper);
  pwd += pick(lower);

  // exactly 2 digits
  pwd += pick(digits);
  pwd += pick(digits);

  // exactly 1 special
  pwd += pick(symbols);

  // fill the rest with letters only
  const lettersOnly = upper + lower;
  while (pwd.length < minLen) pwd += pick(lettersOnly);

  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

/* ✅ STRICT "PROPER" EMAIL FORMAT (no @domain.com only, no leading/trailing dot) */
const EMAIL_FORMAT_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;

/* ✅ Allowed email domains only (edit this list as you like) */
const ALLOWED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.com.ph",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
]);

function countMatches(str, regex) {
  const m = str.match(regex);
  return m ? m.length : 0;
}

function validatePassword(p) {
  if (!p) return "Generate a password.";
  if (p.length < 8) return "Password must be at least 8 characters.";

  const digitCount = countMatches(p, /\d/g);
  const specialCount = countMatches(p, /[!@#$%^&*_\-+=?]/g);

  if (specialCount !== 1)
    return "Password must contain exactly 1 special character.";
  if (digitCount !== 2) return "Password must contain exactly 2 numbers.";

  return "";
}

function validateEmail(emailRaw) {
  const email = (emailRaw || "").trim().toLowerCase();
  if (!email) return "Email is required.";

  if (!EMAIL_FORMAT_REGEX.test(email)) return "Enter a valid email address.";

  const at = email.lastIndexOf("@");
  const domain = email.slice(at + 1);

  if (!ALLOWED_EMAIL_DOMAINS.has(domain)) {
    return "Use a supported email provider (e.g., gmail.com, yahoo.com, outlook.com).";
  }

  return "";
}

export default function AddProfessorModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dept, setDept] = useState("");

  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setDept("");
      setPass("");
      setConfirm("");
      setShowPass(false);
      setShowConfirm(false);
    }
  }, [open]);

  const errors = useMemo(() => {
    const e = {};

    if (!name.trim()) e.name = "Professor name is required.";
    if (!dept.trim()) e.dept = "Department is required.";

    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;

    const passErr = validatePassword(pass);
    if (passErr) e.pass = passErr;

    if (!confirm) e.confirm = "Confirm password is required.";
    if (pass && confirm && pass !== confirm) e.confirm = "Passwords do not match.";

    return e;
  }, [name, email, dept, pass, confirm]);

  const canSubmit = Object.keys(errors).length === 0;

  const handleGenerate = () => {
    const p = generateStrongPassword(10);
    setPass(p);
    setConfirm(p);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit?.({
      name: name.trim(),
      email: email.trim(),
      department: dept.trim(),
      password: pass,
      delivery: "email",
    });

    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="apm-overlay" onMouseDown={onClose}>
      <div className="apm-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="apm-title">Add New Professor</div>

        <form className="apm-form" onSubmit={submit}>
          <div className="apm-field">
            <label>
              Professor Name <span className="apm-req">*</span>
            </label>
            <input
              className={errors.name ? "err" : ""}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <div className="apm-error">{errors.name}</div>}
          </div>

          <div className="apm-field">
            <label>
              Email <span className="apm-req">*</span>
            </label>
            <input
              className={errors.email ? "err" : ""}
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <div className="apm-error">{errors.email}</div>}
          </div>

          <div className="apm-field">
            <label>
              Password <span className="apm-req">*</span>
            </label>

            <div className={`apm-passWrap ${errors.pass ? "err" : ""}`}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Click generate password"
                value={pass}
                disabled
              />
              <button
                type="button"
                className="apm-eye"
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? <EyeOpen /> : <EyeOff />}
              </button>
            </div>

            {errors.pass && <div className="apm-error">{errors.pass}</div>}
            
          </div>

          <div className="apm-field">
            <label>
              Confirm Password <span className="apm-req">*</span>
            </label>

            <div className={`apm-passWrap ${errors.confirm ? "err" : ""}`}>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                disabled
              />
              <button
                type="button"
                className="apm-eye"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOpen /> : <EyeOff />}
              </button>
            </div>

            {/* Generate button under Confirm Password */}
            <button
              type="button"
              className="apm-generate"
              onClick={handleGenerate}
            >
              Generate Password
            </button>

            {errors.confirm && <div className="apm-error">{errors.confirm}</div>}
          </div>

          <div className="apm-field">
            <label>
              Department <span className="apm-req">*</span>
            </label>
            <input
              className={errors.dept ? "err" : ""}
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            />
            {errors.dept && <div className="apm-error">{errors.dept}</div>}
          </div>

          <div className="apm-actions">
            <button className="apm-btn primary" disabled={!canSubmit}>
              Add
            </button>
            <button className="apm-btn" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ICONS */
function EyeOpen() {
  return (
    <svg className="apm-eyeIcon" viewBox="0 0 24 24">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg className="apm-eyeIcon" viewBox="0 0 24 24">
      <path d="M3 3l18 18" />
      <path d="M6.2 6.2C3.9 7.9 2.5 10 2 12c.8 3 4.7 7 10 7" />
    </svg>
  );
}
