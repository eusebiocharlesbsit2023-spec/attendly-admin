import React, { useEffect, useState } from "react";
import "./EditStudentModal.css";

export default function EditStudentModal({ open, student, onClose, onSaveClick }) {
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    if (open && student) {
      setStatus(student.status || "Active");
    }
  }, [open, student]);

  if (!open || !student) return null;

  return (
    <div className="esm-overlay" onMouseDown={onClose}>
      <div className="esm-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="esm-row">
          <div className="esm-label">Student Name</div>
          <div className="esm-value">{student.name}</div>
        </div>

        <div className="esm-row">
          <div className="esm-label">Student Id</div>
          <div className="esm-value">{student.studentId}</div>
        </div>

        <div className="esm-row">
          <div className="esm-label">Device Id</div>
          <div className="esm-value">{student.deviceId}</div>
        </div>

        <div className="esm-row">
          <div className="esm-label">Classes</div>
          <div className="esm-value">{student.classes}</div>
        </div>

        <div className="esm-row">
          <div className="esm-label">Status</div>

          <div className="esm-statusWrap">
            <span className={`esm-pill ${status === "Active" ? "active" : "inactive"}`}>{status}</span>

            <select className="esm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <button
          className="esm-save"
          type="button"
          onClick={() => onSaveClick?.({ ...student, status })}
        >
          Save
        </button>
      </div>
    </div>
  );
}
