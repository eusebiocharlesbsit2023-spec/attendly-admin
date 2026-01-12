import React, { useEffect, useState } from "react";
import "./ActivityHistoryModal.css";
import {
  getNotifications,
  initNotifications,
  markAsReadById,
  markAsUnreadById,
  deleteNotificationById,
  markAllAsRead,
} from "../lib/notifications";

export default function ActivityHistoryModal({
  open,
  onClose,
  items = [],
  anchorRect = null,
}) {
  const [posStyle, setPosStyle] = useState(null);
  const [notes, setNotes] = useState(() => getNotifications());
  const [openMoreIndex, setOpenMoreIndex] = useState(null);

  // If the store is empty and the parent passed seed `items`, initialize the store
  useEffect(() => {
    const current = getNotifications();
    if ((current == null || current.length === 0) && items && items.length > 0) {
      initNotifications(items);
      setNotes(getNotifications());
    }
  }, [items]);

  // keep local notes in sync when modal opens
  useEffect(() => {
    if (open) setNotes(getNotifications());
  }, [open]);

  useEffect(() => {
    // compute anchored position if anchorRect is provided and screen is large enough
    if (!open) return;

    const gap = 8;
    const cardWidth = 560; // matches CSS default
    const vw = window.innerWidth;

    if (anchorRect && vw > 620) {
      const top = anchorRect.bottom + gap;
      // prefer left positioning unless it would overflow, then use right
      if (anchorRect.left + cardWidth + 16 > vw) {
        // overflow: position by right
        const right = Math.max(8, vw - anchorRect.right + gap);
        setPosStyle({ position: "fixed", top: `${top}px`, right: `${right}px` });
      } else {
        setPosStyle({
          position: "fixed",
          top: `${top}px`,
          left: `${Math.max(8, anchorRect.left)}px`,
        });
      }
    } else {
      setPosStyle(null); // use centered default
    }

    // recompute on resize
    function handleResize() {
      if (anchorRect && window.innerWidth > 620) {
        const vw2 = window.innerWidth;
        const top = anchorRect.bottom + gap;
        if (anchorRect.left + cardWidth + 16 > vw2) {
          const right = Math.max(8, vw2 - anchorRect.right + gap);
          setPosStyle({ position: "fixed", top: `${top}px`, right: `${right}px` });
        } else {
          setPosStyle({
            position: "fixed",
            top: `${top}px`,
            left: `${Math.max(8, anchorRect.left)}px`,
          });
        }
      } else {
        setPosStyle(null);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open, anchorRect]);

  const markAsRead = (idx) => {
    const note = notes[idx];
    if (!note) return;
    markAsReadById(note.id);
    setNotes(getNotifications());
    setOpenMoreIndex(null);
  };

  const markAsUnread = (idx) => {
    const note = notes[idx];
    if (!note) return;
    markAsUnreadById(note.id);
    setNotes(getNotifications());
    setOpenMoreIndex(null);
  };

  const deleteNotification = (idx) => {
    const note = notes[idx];
    if (!note) return;
    deleteNotificationById(note.id);
    setNotes(getNotifications());
    setOpenMoreIndex(null);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setNotes(getNotifications());
    setOpenMoreIndex(null);
  };

  if (!open) return null;

  return (
    <div className="ahm-overlay" onMouseDown={onClose}>
      <div
        className="ahm-card"
        style={posStyle || undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
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
          {notes.length === 0 ? (
            <div className="ahm-empty">No activity yet.</div>
          ) : (
            notes.map((a, idx) => (
              <div className={`ahm-item ${a.read ? "read" : ""}`} key={idx}>
                <div className="ahm-dot" />
                <div className="ahm-text">
                  <div className="ahm-main">{a.text}</div>
                  <div className="ahm-time">{a.time}</div>
                </div>

                <button
                  className="ahm-more"
                  type="button"
                  aria-label="More"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMoreIndex(openMoreIndex === idx ? null : idx);
                  }}
                >
                  ⋯
                </button>

                {openMoreIndex === idx && (
                  <div className="ahm-more-menu" onMouseDown={(e) => e.stopPropagation()}>
                    {!a.read ? (
                      <button
                        type="button"
                        className="ahm-more-item"
                        onClick={() => {
                          markAsRead(idx);
                          setOpenMoreIndex(null);
                        }}
                      >
                        Mark as read
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ahm-more-item"
                        onClick={() => {
                          markAsUnread(idx);
                          setOpenMoreIndex(null);
                        }}
                      >
                        Mark as unread
                      </button>
                    )}

                    <button
                      type="button"
                      className="ahm-more-item danger"
                      onClick={() => {
                        deleteNotification(idx);
                        setOpenMoreIndex(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="ahm-footer">
          <button className="ahm-markAll" type="button" onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>

          <button className="ahm-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
