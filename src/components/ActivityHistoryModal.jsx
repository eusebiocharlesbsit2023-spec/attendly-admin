import React from "react";
import "./ActivityHistoryModal.css";

export default function ActivityHistoryModal({
  open,
  onClose,
  items = [],
  variant = "modal", // "modal" | "dropdown"
}) {
  if (!open) return null;

  // DROPDOWN MODE: card lang, walang overlay
  if (variant === "dropdown") {
    return (
      <div className="ahm-card ahm-dropdownCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ahm-header">
          <div>
            <div className="ahm-title">Activity History</div>
            <div className="ahm-sub">All recent actions</div>
          </div>

          <button className="ahm-close" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="ahm-list">
          {items.length === 0 ? (
            <div className="ahm-empty">No activity yet.</div>
          ) : (
            items.map((a, idx) => (
              <div className="ahm-item" key={idx}>
                <div className="ahm-dot" />
                <div className="ahm-text">
                  <div className="ahm-main">{a.text}</div>
                  <div className="ahm-time">{a.time}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="ahm-footer">
          <button className="ahm-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  // DEFAULT MODAL MODE: existing behavior mo (overlay + center)
  return (
    <div className="ahm-overlay" onMouseDown={onClose}>
      <div className="ahm-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ahm-header">
          <div>
            <div className="ahm-title">Activity History</div>
            <div className="ahm-sub">All recent actions</div>
          </div>

          <button className="ahm-close" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="ahm-list">
          {items.length === 0 ? (
            <div className="ahm-empty">No activity yet.</div>
          ) : (
            items.map((a, idx) => (
              <div className="ahm-item" key={idx}>
                <div className="ahm-dot" />
                <div className="ahm-text">
                  <div className="ahm-main">{a.text}</div>
                  <div className="ahm-time">{a.time}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="ahm-footer">
          <button className="ahm-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
