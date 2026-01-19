import React, { useEffect, useMemo, useState } from "react";
import "./EditStudentModal.css";

export default function EditStudentModal({ open, student, onClose, onSaveClick }) {
  const [status, setStatus] = useState("");
  const [originalStatus, setOriginalStatus] = useState("");

  useEffect(() => {
    if (open && student) {
      const s = student.status || "Active";
      setStatus(s);          // ✅ show current status
      setOriginalStatus(s);  // ✅ keep original for comparison
    }
  }, [open, student]);

  const changed = useMemo(
    () => status !== originalStatus,
    [status, originalStatus]
  );

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
            <select
              className="esm-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Active">Activate</option>
              <option value="Inactive">Deactivate</option>
            </select>
          </div>
        </div>

        <button
          className={`esm-save ${!changed ? "disabled" : ""}`}
          type="button"
          disabled={!changed}
          title={!changed ? "Change the status first" : "Save changes"}
          onClick={() => onSaveClick?.({ ...student, status })}
        >
          Save
        </button>
      </div>
    </div>
  );
}
