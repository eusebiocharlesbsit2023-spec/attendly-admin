import React, { useMemo, useState, useEffect } from "react";
import "./AddStudentModal.css";
import supabase from "../helper/supabaseClient";

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
  const [step, setStep] = useState(1); // 1 or 2
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
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setPassword(buildPasswordFromSurname(surname));
  }, [surname]);

  // Validation logic
  const errors = useMemo(() => {
    const e = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!surname.trim()) e.surname = "Required";
    if (!email.trim()) e.email = "Required";
    if (!studentNumber.trim()) e.studentNumber = "Required";
    if (studentNumber.length < 10) e.studentNumber = "Too short (include -N)";
    if (!program) e.program = "Required";
    if (!yearLevel) e.yearLevel = "Required";
    if (!section) e.section = "Required";
    return e;
  }, [firstName, surname, email, studentNumber, yearLevel, section, program]);

  const step1Valid = firstName.trim() && surname.trim();
  const step2Valid = Object.keys(errors).length === 0;

  const resetForm = () => {
    setStep(1);
    setFirstName(""); setMiddleName(""); setSurname(""); setSuffix("");
    setStudentNumber(""); setEmail(""); setYearLevel(""); setSection("");
    setProgram(""); setPassword(""); setErrorMsg("");
    setConfirmOpen(false); setSubmitting(false); setSubmitAttempted(false);
  };

  const handleNext = () => {
    if (step1Valid) setStep(2);
    else setSubmitAttempted(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!step2Valid || submitting) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      // Check for duplicates
      const { data: existing, error: checkErr } = await supabase
        .from('students')
        .select('student_number, email')
        .or(`student_number.eq.${studentNumber.trim().toUpperCase()},email.eq.${email.trim().toLowerCase()}`)
        .maybeSingle();

      if (existing) {
        setErrorMsg(existing.student_number === studentNumber.trim().toUpperCase() 
          ? "Student Number already exists." 
          : "Email already exists.");
        setSubmitting(false);
        return;
      }
      setConfirmOpen(true);
    } catch (err) {
      setErrorMsg("Check failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmYes = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      const payload = {
        student_number: studentNumber.trim().toUpperCase(),
        student_email: email.trim().toLowerCase(),
        login_password: `${password}${studentNumber.trim().toUpperCase()}`,
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: `${surname.trim()} ${suffix.trim()}`.trim(),
        year_level: yearLevel,
        section,
        program,
        status: "Active",
      };

      const { data, error } = await supabase.functions.invoke("create-student-and-email", { body: payload });
      if (error || !data?.success) throw new Error(data?.message || error?.message);

      onSubmit?.({ studentRow: data, displayName: `${firstName} ${surname}` });
      resetForm();
      onClose?.();
    } catch (e) {
      setErrorMsg(String(e.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="asm-overlay">
      {/* Confirmation Modal logic remains here... */}

      <div className="asm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="asm-title">Add New Student</div>
        <div className="asm-stepper">
           <span className={step === 1 ? "active" : ""}>Personal</span>
           <span className="separator">→</span>
           <span className={step === 2 ? "active" : ""}>Academic</span>
        </div>

        <form className="asm-form" onSubmit={handleSubmit}>
          {errorMsg && <p className="asm-errorText">{errorMsg}</p>}

          {step === 1 && (
            <div className="form-step-container personal">
              <div>
                <label className="asm-label">First Name <span className="asm-req">*</span></label>
                <input className={`asm-input ${submitAttempted && errors.firstName ? 'asm-input-error' : ''}`} value={firstName} onChange={e => setFirstName(e.target.value)} />
                {submitAttempted && errors.firstName && <p className="asm-fieldError">{errors.firstName}</p>}
              </div>
              <div>
                <label className="asm-label">Middle Name</label>
                <input className="asm-input" value={middleName} onChange={e => setMiddleName(e.target.value)} />
              </div>
              <div>
                <label className="asm-label">Surname <span className="asm-req">*</span></label>
                <input className={`asm-input ${submitAttempted && errors.surname ? 'asm-input-error' : ''}`} value={surname} onChange={e => setSurname(e.target.value)} />
                {submitAttempted && errors.surname && <p className="asm-fieldError">{errors.surname}</p>}
              </div>
              <div>
                <label className="asm-label">Suffix</label>
                <input className="asm-input" value={suffix} onChange={e => setSuffix(e.target.value)} />
              </div>
              <div className="asm-actions">
                <button type="button" className="asm-btn" onClick={() => { resetForm(); onClose?.(); }}>Cancel</button>
                <button type="button" className="asm-btn primary" onClick={handleNext}>Next</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step-container academic">
              <div>
                <label className="asm-label">Program <span className="asm-req">*</span></label>
                <select className={`asm-input ${submitAttempted && errors.program ? 'asm-input-error' : ''}`} value={program} onChange={e => setProgram(e.target.value)}>
                  <option value="">Select Program</option>
                  {programs.map(p => <option key={p}>{p}</option>)}
                </select>
                {submitAttempted && errors.program && <p className="asm-fieldError">{errors.program}</p>}
              </div>

              <div className="asm-row">
                <div className="asm-col">
                  <label className="asm-label">Year <span className="asm-req">*</span></label>
                  <select className={`asm-input ${submitAttempted && errors.yearLevel ? 'asm-input-error' : ''}`} value={yearLevel} onChange={e => setYearLevel(e.target.value)}>
                    <option value="">Select</option>
                    {YEAR_LEVELS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                  </select>
                  {submitAttempted && errors.yearLevel && <p className="asm-fieldError">{errors.yearLevel}</p>}
                </div>
                <div className="asm-col">
                  <label className="asm-label">Section <span className="asm-req">*</span></label>
                  <select className={`asm-input ${submitAttempted && errors.section ? 'asm-input-error' : ''}`} value={section} onChange={e => setSection(e.target.value)}>
                    <option value="">Select</option>
                    {sections.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {submitAttempted && errors.section && <p className="asm-fieldError">{errors.section}</p>}
                </div>
              </div>

              <div>
                <label className="asm-label">Email <span className="asm-req">*</span></label>
                <input className={`asm-input ${submitAttempted && errors.email ? 'asm-input-error' : ''}`} value={email} onChange={e => setEmail(e.target.value)} />
                {submitAttempted && errors.email && <p className="asm-fieldError">{errors.email}</p>}
              </div>

              <div>
                <label className="asm-label">Student Number <span className="asm-req">*</span></label>
                <input className={`asm-input ${submitAttempted && errors.studentNumber ? 'asm-input-error' : ''}`} value={studentNumber} onChange={e => setStudentNumber(e.target.value)} />
                {submitAttempted && errors.studentNumber && <p className="asm-fieldError">{errors.studentNumber}</p>}
              </div>

              <div className="asm-actions">
                <button type="button" className="asm-btn" onClick={() => { setSubmitAttempted(false); setStep(1); }}>Back</button>
                <button type="submit" className="asm-btn primary" disabled={submitting}>
                  {submitting ? "Checking..." : "Add Student"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}