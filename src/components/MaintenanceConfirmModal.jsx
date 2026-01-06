import React from "react";
import "./MaintenanceConfirmModal.css";

export default function MaintenanceConfirmModal({
  open,
  title = "Confirm?",
  onYes,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="mcm-overlay" onMouseDown={onCancel}>
      <div className="mcm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mcm-title">{title}</div>

        <div className="mcm-actions">
          <button className="mcm-btn yes" type="button" onClick={onYes}>
            Yes
          </button>
          <button className="mcm-btn" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
