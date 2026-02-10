import React, { useEffect, useMemo, useState } from "react";
import "./AddProfessorModal.css";
import supabase from "../helper/supabaseClient";
import { supabaseCreateUser } from "../helper/supabaseCreateUserClient";
import SmallConfirmModal from "../components/SmallConfirmModal";

export async function createProfessorAccount({ professor_name, email, department, password }) {

  // 1) create auth user (temp client)
  const { data: sign, error: signErr } = await supabaseCreateUser.auth.signUp({
    email,
    password,
  });
  if (signErr) throw signErr;

  const uuid = sign?.user?.id;
  if (!uuid) throw new Error("No user id returned from signUp.");

  // 2) insert into professors table (main client)
  const { error: insErr } = await supabase.from("professors").insert({
    id: uuid, // usually same as auth.users.id
    professor_name,
    email,
    department,
    status: "Active", // optional
  });
  if (insErr) throw insErr;

  return { uuid };
}

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [dept, setDept] = useState("");
  const [error, setError] = useState("");
  const [deptOptions, setDeptOptions] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);

  const [pass, setPass] = useState("");

  const [showPass, setShowPass] = useState(false);

  const [saving, setSaving] = useState(false);
  const [liveEmailError, setLiveEmailError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    dept: false,
    pass: false,
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setDept("");
      setPass("");
      setShowPass(false);
      setTouched({ name:false, email:false, dept:false, pass:false, confirm:false });
      setSubmitted(false);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const loadDepartments = async () => {
      setDeptLoading(true);
      try {
        const { data, error: deptErr } = await supabase
          .from("subjects")
          .select("department")
          .order("department", { ascending: true });

        if (deptErr) throw deptErr;
        const unique = Array.from(new Set((data || []).map((d) => d.department).filter(Boolean)));
        setDeptOptions(unique);
      } catch (err) {
        console.error("Load departments failed:", err.message);
        setDeptOptions([]);
      } finally {
        setDeptLoading(false);
      }
    };
    loadDepartments();
  }, [open]);

  const showErr = (key) => submitted || touched[key];

  const errors = useMemo(() => {
    const e = {};

    if (!firstName.trim()) e.firstName = "First name is required.";
    if (!lastName.trim()) e.lastName = "Last name is required.";
    if (!dept.trim()) e.dept = "Department is required.";

    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;
    if (liveEmailError) e.email = liveEmailError;

    const passErr = validatePassword(pass);
    if (passErr) e.pass = passErr;

    return e;
  }, [firstName, lastName, email, dept, pass, confirm, liveEmailError]);

  useEffect(() => {
    if (!open) return;
    const emailLower = (email || "").trim().toLowerCase();
    if (!emailLower) {
      setLiveEmailError("");
      return;
    }

    const t = setTimeout(async () => {
      try {
        const [profRes, studentRes] = await Promise.all([
          supabase.from("professors").select("id").eq("email", emailLower).maybeSingle(),
          supabase.from("students").select("id").eq("email", emailLower).maybeSingle(),
        ]);

        if (profRes.error) throw profRes.error;
        if (studentRes.error) throw studentRes.error;

        if (profRes.data || studentRes.data) {
          setLiveEmailError("This email address is already registered.");
          return;
        }

        setLiveEmailError("");
      } catch {
        setLiveEmailError("");
      }
    }, 400);

    return () => clearTimeout(t);
  }, [open, email]);

  const canSubmit = Object.keys(errors).length === 0;

  const handleGenerate = () => {
    const p = generateStrongPassword(10);
    setPass(p);
    setTouched((prev) => ({ ...prev, pass: true}));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");

    if (!canSubmit) return;

    setSaving(true); // Loading state habang nagche-check sa DB

    try {
      // ✅ Check kung existing na ang email sa 'professors' table
      const emailLower = email.trim().toLowerCase();
      const { data: existingProf, error: checkErr } = await supabase
        .from("professors")
        .select("email")
        .eq("email", emailLower)
        .maybeSingle();

      if (checkErr) throw new Error("Database check failed: " + checkErr.message);

      if (existingProf) {
        setError("This email address is already registered.");
        setSaving(false);
        return; // Hihinto rito, hindi lalabas ang confirmation modal
      }

      // ✅ Kung wala pang duplicate, proceed sa confirmation
      const { data: existingStudent, error: studentErr } = await supabase
        .from("students")
        .select("email")
        .eq("email", emailLower)
        .maybeSingle();

      if (studentErr) throw new Error("Database check failed: " + studentErr.message);

      if (existingStudent) {
        setError("This email address is already registered.");
        setSaving(false);
        return;
      }

      setConfirmOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const createCancel = () => {
    if (saving) return;
    setConfirmOpen(false);
  };

  const createYes = async () => {
    if (saving) return;

    setSaving(true);
    setError("");
    
    // close confirm
    setConfirmOpen(false);

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        department: dept.trim(),
        password: pass,
        status: "Active",
      };

      const { data, error } = await supabase.functions.invoke("create-prof-email", {
        body: payload,
      });

      if (error) {
        const res = error.context?.response;
        setError(res ? await res.text() : error.message);
        return;
      }

      if (!data?.success) {
        setError(`${data?.step ?? "error"}: ${data?.message ?? "Unknown error"}`);
        return;
      }

      onSubmit?.(); // refresh list
      
    } catch (err) {
      const msg = err?.message || "Failed to create professor.";
      setError(msg);
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="apm-overlay" onMouseDown={onClose}>
      <div className="apm-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="apm-title">Add New Professor</div>

        <div className="error-text">
          {error}
        </div>
        <form className="apm-form" onSubmit={submit}>
          <div className="apm-field">
            <label>
              First Name <span className="apm-req">*</span>
            </label>
            <input
              className={showErr("firstName") && errors.firstName ? "err" : ""}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
            />
            {showErr("firstName") && errors.firstName && (
              <div className="apm-error">{errors.firstName}</div>
            )}
          </div>

          <div className="apm-field">
            <label>
              Last Name <span className="apm-req">*</span>
            </label>
            <input
              className={showErr("lastName") && errors.lastName ? "err" : ""}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
            />
            {showErr("lastName") && errors.lastName && (
              <div className="apm-error">{errors.lastName}</div>
            )}
          </div>

          <div className="apm-field">
            <label>
              Email <span className="apm-req">*</span>
            </label>
            <input
              className={showErr("email") && errors.email ? "err" : ""}
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {liveEmailError ? <div className="apm-error">{liveEmailError}</div> : (showErr("email") && errors.email && <div className="apm-error">{errors.email}</div>)}
          </div>

          <div className="apm-field">
            <label>
              Password <span className="apm-req">*</span>
            </label>

            <div className={`apm-passWrap ${showErr("pass") && errors.pass ? "err" : ""}`}>
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

            {/* Generate button under Confirm Password */}
            <button
              type="button"
              className="apm-generate"
              onClick={handleGenerate}
            >
              Generate Password
            </button>

            {showErr("pass") && errors.pass && <div className="apm-error">{errors.pass}</div>}
            
          </div>

          <div className="apm-field">
            <label>
              Department <span className="apm-req">*</span>
            </label>
            <select
              className={showErr("dept") && errors.dept ? "err" : ""}
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              <option value="">{deptLoading ? "Loading..." : "Select Department"}</option>
              {deptOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {showErr("dept") && errors.dept && <div className="apm-error">{errors.dept}</div>}
          </div>

          <div className="apm-actions">
            <button className="apm-btn primary" disabled={saving}>
              {saving ? "Adding..." : "Add"}
            </button>
            <button className="apm-btn" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
        {/* Confirm modal */}
        <SmallConfirmModal
          open={confirmOpen}
         title={
            saving
              ? "Adding..."
              : `Add Professor ${firstName.trim()} ${lastName.trim()}?`
          }
          onYes={createYes}
          onCancel={createCancel}
        />
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
