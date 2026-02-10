import React, { useEffect, useState } from "react";
import "./AddSubjectModal.css";
import supabase from "../helper/supabaseClient";

export default function AddSubjectModal({ open, onClose, onSubmit, departments = [], error = "" }) {
  const [department, setDepartment] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [liveCodeError, setLiveCodeError] = useState("");
  const [liveNameError, setLiveNameError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDepartment("");
    setCourseCode("");
    setCourseName("");
    setLiveCodeError("");
    setLiveNameError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const code = courseCode.trim();
    const name = courseName.trim();

    if (!code && !name) {
      setLiveCodeError("");
      setLiveNameError("");
      return;
    }

    const t = setTimeout(async () => {
      try {
        const { data, error: existsErr } = await supabase
          .from("subjects")
          .select("id, course_code, course_name")
          .or(`course_code.eq.${code || " "},course_name.eq.${name || " "}`)
          .limit(1);

        if (existsErr) throw existsErr;
        if (data && data.length > 0) {
          const dup = data[0];
          if (code && dup.course_code === code) {
            setLiveCodeError("Course code already exists.");
          } else {
            setLiveCodeError("");
          }
          if (name && dup.course_name === name) {
            setLiveNameError("Course name already exists.");
          } else {
            setLiveNameError("");
          }
          return;
        }
        setLiveCodeError("");
        setLiveNameError("");
      } catch {
        setLiveCodeError("");
        setLiveNameError("");
      }
    }, 350);

    return () => clearTimeout(t);
  }, [open, courseCode, courseName]);

  const submit = (e) => {
    e.preventDefault();
    onSubmit?.({
      department: department.trim(),
      courseCode: courseCode.trim(),
      courseName: courseName.trim(),
    });
  };

  if (!open) return null;

  return (
    <div className="asm-overlay" onMouseDown={onClose}>
      <div className="asm-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="asm-title">Add Subject</div>
        {error ? <div className="asm-errorText">{error}</div> : null}

        <form className="asm-form" onSubmit={submit}>
          <div className="asm-field">
            <label>Department</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer System Department"
              list="asm-departments"
            />
            <datalist id="asm-departments">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div className="asm-field">
            <label>Course Code</label>
            <input
              className={liveCodeError ? "asm-input-error" : ""}
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              placeholder="e.g. CS 101"
            />
            {liveCodeError ? <div className="asm-errorText field">{liveCodeError}</div> : null}
          </div>
          <div className="asm-field">
            <label>Course Name</label>
            <input
              className={liveNameError ? "asm-input-error" : ""}
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Introduction to Programming"
            />
            {liveNameError ? <div className="asm-errorText field">{liveNameError}</div> : null}
          </div>

          <div className="asm-actions">
            <button className="asm-btn primary" type="submit">
              Save Subject
            </button>
            <button className="asm-btn" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
