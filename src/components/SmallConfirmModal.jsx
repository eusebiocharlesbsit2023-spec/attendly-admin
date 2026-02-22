import React from "react";
import "./SmallConfirmModal.css";

export default function SmallConfirmModal({
  open,
  title,
  description = "",
  yesDisabled = false,
  onYes,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="scm-overlay" onMouseDown={onCancel}>
      <div className="scm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="scm-title">{title}</div>
        {description ? <div className="scm-desc">{description}</div> : null}

        <div className="scm-actions">
          <button
            className={`scm-btn yes ${yesDisabled ? "disabled" : ""}`}
            type="button"
            onClick={onYes}
            disabled={yesDisabled}
          >
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
