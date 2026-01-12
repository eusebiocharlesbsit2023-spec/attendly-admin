import React, { useMemo, useState, useEffect } from "react";
import "./AddStudentModal.css";
import supabase from "../helper/supabaseClient";
import { supabaseCreateUser } from "../helper/supabaseCreateUserClient";

const YEAR_LEVELS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

const sections = ["A", "B", "C"];

const programs = [
  "BSIT - Bachelor of Science in Information Technology ",
  "BSCS - Bachelor of Science in Computer Science",
  "BSIS - Bachelor of Science in Information System",
  "BSEMC - Bachelor of Science in Entertainment and Multimedia Computing ",
];

function buildPasswordFromSurname(surname) {
  return (surname || "").trim().replace(/\s+/g, "").toUpperCase();
}

export default function AddStudentModal({ open, onClose, onSubmit }) {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [surname, setSurname] = useState("");
  const [suffix, setSuffix] = useState("");

  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [section, setSection] = useState("");
  const [password, setPassword] = useState("");
  const [program, setProgram] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setPassword(buildPasswordFromSurname(surname));
  }, [surname]);

  const errors = useMemo(() => {
    const e = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!surname.trim()) e.surname = "Required";
    if (!email.trim()) e.email = "Required";
    if (!studentNumber.trim()) e.studentNumber = "Required";
    if (studentNumber.length < 10) e.studentNumber = "Student Number must be 8 characters above (Remember to include -N)";
    if (!program) e.program = "Required";
    if (!yearLevel) e.yearLevel = "Required";
    if (!section) e.section = "Required";
    return e;
  }, [firstName, surname, email, studentNumber, yearLevel, section, program]);

  const canSubmit = Object.keys(errors).length === 0;

  const resetForm = () => {
    setFirstName("");
    setMiddleName("");
    setSurname("");
    setSuffix("");
    setStudentNumber("");
    setEmail("");
    setYearLevel("");
    setSection("");
    setProgram("");
    setPassword("");
    setErrorMsg("");
    setConfirmOpen(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    setConfirmOpen(false);
    setErrorMsg("");
    onClose?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setErrorMsg("");
    setConfirmOpen(true);
  };

  const confirmNo = () => {
    if (submitting) return;
    setConfirmOpen(false);
  };

  const confirmYes = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    setErrorMsg("");

    try {
      const generatedEmail = `${studentNumber.trim()}@attendly.com`;
      const generatedPass = `${password}${studentNumber.toUpperCase()}`;

      const { data: authData, error: authError } =
        await supabaseCreateUser.auth.signUp({
          email: generatedEmail,
          password: generatedPass,
        });

      if (authError) {
        setErrorMsg(authError.message);
        return;
      }

      const studentID = authData?.user?.id;
      if (!studentID) {
        setErrorMsg("No user id returned from signup.");
        return;
      }

      const payload = {
        id: studentID,
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: `${surname.trim()} ${suffix.trim()}`.trim(),
        student_number: studentNumber.trim().toUpperCase(),
        year_level: yearLevel,
        section,
        program,
        email: email.trim(),
        status: "Active",
      };

      const { data, error } = await supabase
        .from("student_users")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // ✅ Tell parent (parent will show success modal)
      onSubmit?.({
        authData,
        studentRow: data,
        displayName: `${firstName} ${surname}`.trim(),
        studentNumber: studentNumber.trim().toUpperCase(),
      });

      // ✅ reset + close THIS modal
      resetForm();
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="asm-overlay"
      onMouseDown={() => {
        if (!confirmOpen && !submitting) handleClose();
      }}
    >
      {/* Confirmation overlay */}
      {confirmOpen && (
        <div className="scm-overlay" onMouseDown={confirmNo}>
          <div className="scm-card" onMouseDown={(e) => e.stopPropagation()}>
            <p className="scm-text">
              Add this student?
              <br />
              <br />
              <b>
                {firstName} {surname}
              </b>
              <br />
              ({studentNumber})
            </p>

            <div className="asm-actions">
              <button
                type="button"
                className="asm-btn primary"
                onClick={confirmYes}
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Yes"}
              </button>
              <button
                type="button"
                className="asm-btn"
                onClick={confirmNo}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="asm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="asm-title">Add New Student</div>

        <form className="asm-form" onSubmit={handleSubmit}>
          {errorMsg && <p className="asm-errorText">{errorMsg}</p>}

          <label className="asm-label">
            First Name <span className="asm-req">*</span>
          </label>
          <input
            className={`asm-input ${errors.firstName ? "err" : ""}`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <label className="asm-label">Middle Name</label>
          <input
            className="asm-input"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
          />

          <label className="asm-label">
            Surname <span className="asm-req">*</span>
          </label>
          <input
            className={`asm-input ${errors.surname ? "err" : ""}`}
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />

          <label className="asm-label">Suffix</label>
          <input
            className="asm-input"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
          />

          <label className="asm-label">
            Year Level <span className="asm-req">*</span>
          </label>
          <select
            className={`asm-input asm-select ${errors.yearLevel ? "err" : ""}`}
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
          >
            <option value="" hidden>
              Select Year
            </option>
            {YEAR_LEVELS.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>

          <label className="asm-label">
            Section <span className="asm-req">*</span>
          </label>
          <select
            className={`asm-input asm-select ${errors.section ? "err" : ""}`}
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            <option value="">Select Section</option>
            {sections.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <label className="asm-label">
            Program <span className="asm-req">*</span>
          </label>
          <select
            className={`asm-input asm-select ${errors.program ? "err" : ""}`}
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          >
            <option value="">Select Program</option>
            {programs.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>

          <label className="asm-label">
            Email <span className="asm-req">*</span>
          </label>
          <input
            className={`asm-input ${errors.email ? "err" : ""}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="asm-label">
            Student Number <span className="remember">(must to include -N)</span><span className="asm-req">*</span>
          </label>
          <input
            className={`asm-input ${errors.studentNumber ? "err" : ""}`}
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
          />

          <label className="asm-label">Password</label>
          <input
            className="asm-input asm-disabledPass"
            value={`${password}${studentNumber.toUpperCase()}`}
            placeholder="Generated by surname"
            disabled
          />
          <div className="asm-hint">Password is generated by surname</div>

          <div className="asm-actions">
            <button className="asm-btn primary" disabled={!canSubmit || submitting}>
              {submitting ? "Adding..." : "Add"}
            </button>
            <button className="asm-btn" type="button" onClick={handleClose} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
