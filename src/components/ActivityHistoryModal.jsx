import React, { useEffect, useState } from "react";
import "./ActivityHistoryModal.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getNotifications,
  syncNotifications,
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
  const [openMorePos, setOpenMorePos] = useState(null);

  const sig = (x) => `${(x?.text ?? "").trim()}__${(x?.time ?? "").trim()}`;

  // ✅ Sync notifications with dashboard items
  useEffect(() => {
    if (!items || items.length === 0) return;

    const current = getNotifications() || [];
    const currentMap = new Map(current.map((n) => [sig(n), n]));

    const normalized = items.map((it, idx) => {
      const key = sig(it);
      const existing = currentMap.get(key);

      return {
        id: existing?.id ?? `seed_${idx}_${key}`,
        text: it.text,
        time: it.time,
        read: existing?.read ?? false,
      };
    });

    syncNotifications(normalized);
    setNotes(getNotifications());
  }, [items]);

  // keep local notes in sync when modal opens
  useEffect(() => {
    if (open) {
      setNotes(getNotifications());
    } else {
      setOpenMoreIndex(null);
      setOpenMorePos(null);
    }
  }, [open]);

  // positioning logic (unchanged)
  useEffect(() => {
    if (!open) return;

    const gap = 8;
    const cardWidth = 560;
    const vw = window.innerWidth;

    if (anchorRect && vw > 620) {
      const top = anchorRect.bottom + gap;
      if (anchorRect.left + cardWidth + 16 > vw) {
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
      setPosStyle(null);
    }

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
    setOpenMorePos(null);
  };

  const markAsUnread = (idx) => {
    const note = notes[idx];
    if (!note) return;
    markAsUnreadById(note.id);
    setNotes(getNotifications());
    setOpenMoreIndex(null);
    setOpenMorePos(null);
  };

  const deleteNotification = (idx) => {
    const note = notes[idx];
    if (!note) return;
    deleteNotificationById(note.id);
    setNotes(getNotifications());
    setOpenMoreIndex(null);
    setOpenMorePos(null);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setNotes(getNotifications());
    setOpenMoreIndex(null);
    setOpenMorePos(null);
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
          {/* ❌ X button removed */}
        </div>

        <div className="ahm-list">
          {notes.length === 0 ? (
            <div className="ahm-empty">No activity yet.</div>
          ) : (
            notes.map((a, idx) => (
              <div className={`ahm-item ${a.read ? "read" : ""}`} key={a.id || idx}>
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
                    const rect = e.currentTarget.getBoundingClientRect();
                    const menuWidth = 160; // approximate menu width
                    const gap = 6;
                    const top = rect.bottom + gap;
                    const left = Math.max(8, rect.right - menuWidth);
                    const willClose = openMoreIndex === idx;
                    setOpenMoreIndex(willClose ? null : idx);
                    setOpenMorePos(willClose ? null : { top: `${top}px`, left: `${left}px` });
                  }}
                >
                  ⋯
                </button>

                {openMoreIndex === idx && (
                  <div
                    className="ahm-more-menu"
                    style={
                      openMorePos
                        ? { position: "fixed", top: openMorePos.top, left: openMorePos.left, zIndex: 100000 }
                        : { position: "fixed", zIndex: 100000 }
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                  >
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
