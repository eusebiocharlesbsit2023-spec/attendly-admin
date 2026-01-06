import React from "react";
import "./SmallConfirmModal.css";

export default function SmallConfirmModal({ open, title, onYes, onCancel }) {
  if (!open) return null;

  return (
    <div className="scm-overlay" onMouseDown={onCancel}>
      <div className="scm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="scm-title">{title}</div>

        <div className="scm-actions">
          <button className="scm-btn yes" type="button" onClick={onYes}>
            Yes
          </button>
          <button className="scm-btn" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
