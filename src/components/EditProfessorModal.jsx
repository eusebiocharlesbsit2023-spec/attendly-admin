import React, { useEffect, useState } from "react";
import "./EditProfessorModal.css";

export default function EditProfessorModal({ open, professor, onClose, onSaveClick }) {
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    if (open && professor) {
      setStatus(professor.status || "Active");
    }
  }, [open, professor]);

  if (!open || !professor) return null;

  const handleSave = () => {
    const updated = { ...professor, status };
    onSaveClick(updated); // open confirm in parent
  };

  return (
    <div className="epm-overlay" onClick={onClose}>
      <div className="epm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="epm-grid">
          <div className="epm-label">Professor Name</div>
          <div className="epm-value">{professor.name}</div>

          <div className="epm-label">Email</div>
          <div className="epm-value">{professor.email}</div>

          <div className="epm-label">Classes</div>
          <div className="epm-value">{professor.classes}</div>

          <div className="epm-label">Status</div>
          <div className="epm-value">
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

        <div className="epm-actions">
          <button className="epm-save" type="button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
