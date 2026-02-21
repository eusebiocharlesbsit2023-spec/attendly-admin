import React, { useEffect, useMemo, useState } from "react";
import "./EditStudentModal.css";

export default function EditStudentModal({ open, student, onClose, onSaveClick, onUnbindRequest }) {
  const [status, setStatus] = useState("");
  const [originalStatus, setOriginalStatus] = useState("");

  useEffect(() => {
    if (open && student) {
      const s = student.status || "Active";
      setStatus(s);
      setOriginalStatus(s);
    }
  }, [open, student]);

  const changed = useMemo(
    () => status !== originalStatus,
    [status, originalStatus]
  );
  const hasBoundDevice = Boolean(student?.macAddress);

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
          <div className="esm-label">Device</div>
          <div className="esm-deviceWrap">
            {!hasBoundDevice && (
              <span className="esm-deviceStatus unbound">{student.deviceText}</span>
            )}
            {hasBoundDevice && (
              <button
                className="esm-unbindBtn"
                type="button"
                onClick={() => onUnbindRequest?.(student)}
              >
                Unbind
              </button>
            )}
          </div>
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

        {/* ✅ Action buttons */}
        <div className="esm-actions">
          <button
            className="esm-cancel"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>

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
    </div>
  );
}
