import React from "react";
import "./ConfirmModal.css";

export default function ConfirmModal({ open, title = "Confirm?", onYes, onCancel }) {
  if (!open) return null;

  return (
    <div className="cm-overlay" onMouseDown={onCancel}>
      <div className="cm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cm-title">{title}</div>
        <div className="cm-actions">
          <button className="cm-btn yes" onClick={onYes} type="button">
            Yes
          </button>
          <button className="cm-btn" onClick={onCancel} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
