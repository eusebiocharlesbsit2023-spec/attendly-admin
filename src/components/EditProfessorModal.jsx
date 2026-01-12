import React, { useEffect, useMemo, useState } from "react";
import "./EditProfessorModal.css";

export default function EditProfessorModal({ open, professor, onClose, onSaveClick }) {
  const [status, setStatus] = useState("Active");
  const [originalStatus, setOriginalStatus] = useState("Active");

  useEffect(() => {
    if (open && professor) {
      const s = professor.status || "Active";
      setStatus(s);
      setOriginalStatus(s); // ✅ store original
    }
  }, [open, professor]);

  const changed = useMemo(() => status !== originalStatus, [status, originalStatus]);

  if (!open || !professor) return null;

  return (
    <div className="epm-overlay" onMouseDown={onClose}>
      <div className="epm-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="epm-row">
          <div className="epm-label">Student Name</div>
          <div className="epm-value">{professor.name}</div>
        </div>

        <div className="epm-row">
          <div className="epm-label">Email</div>
          <div className="epm-value">{professor.email}</div>
        </div>

        <div className="epm-row">
          <div className="epm-label">Classes</div>
          <div className="epm-value">{professor.classes}</div>
        </div>

        <div className="epm-row">
          <div className="epm-label">Status</div>

          <div className="epm-statusWrap">
            <span className={`epm-pill ${status === "Active" ? "active" : "inactive"}`}>
              {status}
            </span>

            <select
              className="epm-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <button
          className={`epm-save ${!changed ? "disabled" : ""}`} // ✅ optional class
          type="button"
          disabled={!changed} // ✅ disable if no change
          title={!changed ? "Change the status first" : "Save changes"}
          onClick={() => onSaveClick?.({ ...professor, status })}
        >
          Save
        </button>
      </div>
    </div>
  );
}
