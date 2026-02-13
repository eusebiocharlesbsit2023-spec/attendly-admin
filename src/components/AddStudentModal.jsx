import React, { useMemo, useState, useEffect } from "react";
import "./AddStudentModal.css";
import supabase from "../helper/supabaseClient";
import SmallConfirmModal from "../components/SmallConfirmModal";

const YEAR_LEVELS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

const sections = ["A", "B", "C"];

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
  const [department, setDepartment] = useState("");
  const [program, setProgram] = useState("");
  const [programs, setPrograms] = useState([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [liveEmailError, setLiveEmailError] = useState("");
  const [liveStudentNoError, setLiveStudentNoError] = useState("");

  useEffect(() => {
    setPassword(buildPasswordFromSurname(surname));
  }, [surname]);

  useEffect(() => {
    if (!open) return;

    const loadPrograms = async () => {
      try {
        const { data, error } = await supabase
          .from("programs")
          .select("department, program_abbr, program_name")
          .order("department", { ascending: true });

        if (error) throw error;
        setPrograms(data || []);
      } catch (err) {
        console.error("Load programs failed:", err.message);
        setPrograms([]);
      }
    };

    loadPrograms();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const emailLower = email.trim().toLowerCase();
    if (!emailLower) {
      setLiveEmailError("");
      return;
    }

    const t = setTimeout(async () => {
      try {
        const [studentRes, profRes] = await Promise.all([
          supabase.from("students").select("id").eq("email", emailLower).maybeSingle(),
          supabase.from("professors").select("id").eq("email", emailLower).maybeSingle(),
        ]);

        if (studentRes.error) throw studentRes.error;
        if (profRes.error) throw profRes.error;

        if (studentRes.data || profRes.data) {
          setLiveEmailError("Email already exists.");
          return;
        }

        setLiveEmailError("");
      } catch {
        setLiveEmailError("");
      }
    }, 400);

    return () => clearTimeout(t);
  }, [open, email]);

  useEffect(() => {
    if (!open) return;
    const studentNo = studentNumber.trim().toUpperCase();
    if (!studentNo) {
      setLiveStudentNoError("");
      return;
    }

    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("students")
          .select("id")
          .eq("student_number", studentNo)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setLiveStudentNoError("Student Number already exists.");
          return;
        }

        setLiveStudentNoError("");
      } catch {
        setLiveStudentNoError("");
      }
    }, 400);

    return () => clearTimeout(t);
  }, [open, studentNumber]);

  // Validation logic
  const errors = useMemo(() => {
    const e = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!surname.trim()) e.surname = "Required";
    if (!email.trim()) e.email = "Required";
    if (!studentNumber.trim()) e.studentNumber = "Required";
    if (studentNumber.length < 10) e.studentNumber = "Too short (include -N)";
    if (liveEmailError) e.email = liveEmailError;
    if (liveStudentNoError) e.studentNumber = liveStudentNoError;
    const sn = studentNumber.trim();
    if (sn && !/-N/i.test(sn)) e.studentNumber = "Student number must include -N.";
    if (/=N/i.test(sn)) e.studentNumber = "Use -N, not =N.";
    if (!department) e.department = "Required";
    if (!program) e.program = "Required";
    if (!yearLevel) e.yearLevel = "Required";
    if (!section) e.section = "Required";
    return e;
  }, [firstName, surname, email, studentNumber, yearLevel, section, department, program, liveEmailError, liveStudentNoError]);

  const departmentOptions = useMemo(() => {
    return Array.from(new Set((programs || []).map((p) => String(p.department || "").trim()).filter(Boolean)));
  }, [programs]);

  const programOptions = useMemo(() => {
    return (programs || [])
      .filter((p) => String(p.department || "").trim() === department)
      .map((p) => `${p.program_abbr} - ${p.program_name}`);
  }, [programs, department]);

  const step1Valid = firstName.trim() && surname.trim();
  const step2Valid = Object.keys(errors).length === 0;

  const resetForm = () => {
    setStep(1);
    setFirstName(""); setMiddleName(""); setSurname(""); setSuffix("");
    setStudentNumber(""); setEmail(""); setYearLevel(""); setSection("");
    setDepartment("");
    setProgram(""); setPassword(""); setErrorMsg("");
    setLiveEmailError(""); setLiveStudentNoError("");
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
      const first = firstName.trim();
      const middle = middleName.trim();
      const last = `${surname.trim()} ${suffix.trim()}`.trim();

      const nameQuery = supabase
        .from("students")
        .select("id")
        .ilike("first_name", first)
        .ilike("last_name", last);

      const { data: nameDup, error: nameErr } = middle
        ? await nameQuery.ilike("middle_name", middle).limit(1)
        : await nameQuery.or("middle_name.is.null,middle_name.eq.").limit(1);

      if (nameErr) throw new Error("Name check failed: " + nameErr.message);
      if (nameDup && nameDup.length > 0) {
        setErrorMsg("Student name already exists.");
        setSubmitting(false);
        return;
      }

      const emailLower = email.trim().toLowerCase();
      const studentNo = studentNumber.trim().toUpperCase();

      // Check for duplicates in students
      const { data: existing, error: checkErr } = await supabase
        .from('students')
        .select('student_number, email')
        .or(`student_number.eq.${studentNo},email.eq.${emailLower}`)
        .maybeSingle();

      if (checkErr) throw new Error("Check failed: " + checkErr.message);

      if (existing) {
        setErrorMsg(existing.student_number === studentNo 
          ? "Student Number already exists." 
          : "Email already exists.");
        setSubmitting(false);
        return;
      }

      // Check for duplicate email in professors
      const { data: existingProf, error: profErr } = await supabase
        .from('professors')
        .select('email')
        .eq('email', emailLower)
        .maybeSingle();

      if (profErr) throw new Error("Check failed: " + profErr.message);

      if (existingProf) {
        setErrorMsg("Email already exists.");
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
        department,
        program,
        status: "Active",
      };

      const { data, error } = await supabase.functions.invoke("create-student-and-email", { body: payload });
      if (error || !data?.success) throw new Error(data?.message || error?.message);

      onSubmit?.({
        studentRow: data,
        displayName: `${firstName} ${surname}`,
        studentNumber: studentNumber.trim().toUpperCase(),
      });
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
      <SmallConfirmModal
        open={confirmOpen}
        title={
          submitting
            ? "Adding..."
            : `Add student ${firstName.trim()} ${surname.trim()}?`
        }
        onYes={confirmYes}
        onCancel={() => setConfirmOpen(false)}
      />

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
                <label className="asm-label">Department <span className="asm-req">*</span></label>
                <select className={`asm-input ${submitAttempted && errors.department ? 'asm-input-error' : ''}`} value={department} onChange={e => { setDepartment(e.target.value); setProgram(""); }}>
                  <option value="">Select Department</option>
                  {departmentOptions.map((d) => <option key={d}>{d}</option>)}
                </select>
                {submitAttempted && errors.department && <p className="asm-fieldError">{errors.department}</p>}
              </div>

              <div>
                <label className="asm-label">Program <span className="asm-req">*</span></label>
                <select className={`asm-input ${submitAttempted && errors.program ? 'asm-input-error' : ''}`} value={program} onChange={e => setProgram(e.target.value)} disabled={!department}>
                  <option value="">{department ? "Select Program" : "Select Department first"}</option>
                  {programOptions.map(p => <option key={p}>{p}</option>)}
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
                <input className={`asm-input ${(liveEmailError || (submitAttempted && errors.email)) ? 'asm-input-error' : ''}`} value={email} onChange={e => setEmail(e.target.value)} />
                {liveEmailError ? <p className="asm-fieldError">{liveEmailError}</p> : (submitAttempted && errors.email && <p className="asm-fieldError">{errors.email}</p>)}
              </div>

              <div>
                <label className="asm-label">Student Number <span className="asm-req">*</span></label>
                <input
                  className={`asm-input ${(liveStudentNoError || (submitAttempted && errors.studentNumber)) ? 'asm-input-error' : ''}`}
                  value={studentNumber}
                  onChange={e => setStudentNumber(e.target.value.toUpperCase())}
                />
                {liveStudentNoError ? <p className="asm-fieldError">{liveStudentNoError}</p> : (submitAttempted && errors.studentNumber && <p className="asm-fieldError">{errors.studentNumber}</p>)}
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
