import React, { useEffect, useState } from "react";
import "./EditSubjectModal.css";

export default function EditSubjectModal({ open, subject, onClose, onSaveClick }) {
  const [department, setDepartment] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");

  useEffect(() => {
    if (!open) return;
    setDepartment(subject?.department ?? "");
    setCourseCode(subject?.course_code ?? "");
    setCourseName(subject?.course_name ?? "");
  }, [open, subject]);

  const submit = (e) => {
    e.preventDefault();
    if (!subject?.id) return;
    onSaveClick?.({
      id: subject.id,
      department: department.trim(),
      course_code: courseCode.trim(),
      course_name: courseName.trim(),
    });
  };

  if (!open) return null;

  return (
    <div className="esm-overlay" onMouseDown={onClose}>
      <div className="esm-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="esm-title">Edit Subject</div>

        <form className="esm-form" onSubmit={submit}>
          <div className="esm-field">
            <label>Department</label>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div className="esm-field">
            <label>Course Code</label>
            <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} />
          </div>
          <div className="esm-field">
            <label>Course Name</label>
            <input value={courseName} onChange={(e) => setCourseName(e.target.value)} />
          </div>

          <div className="esm-actions">
            <button className="esm-btn primary" type="submit">Save</button>
            <button className="esm-btn" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
