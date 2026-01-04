import React, { useEffect, useMemo, useState } from "react";
import "./EditClassModal.css";

export default function EditClassModal({
  open,
  clazz,
  allClasses,
  onClose,
  onSaveClick,
}) {
  const [status, setStatus] = useState("Active");
  const [professor, setProfessor] = useState("");
  const [room, setRoom] = useState("");
  const [schedule, setSchedule] = useState("");
  const [wifi, setWifi] = useState("");

  const profOptions = useMemo(() => {
    const set = new Set((allClasses || []).map((c) => c.professor));
    return Array.from(set);
  }, [allClasses]);

  const roomOptions = useMemo(() => {
    const set = new Set((allClasses || []).map((c) => c.room));
    return Array.from(set);
  }, [allClasses]);

  const scheduleOptions = useMemo(() => {
    const set = new Set((allClasses || []).map((c) => c.schedule));
    return Array.from(set);
  }, [allClasses]);

  useEffect(() => {
    if (open && clazz) {
      setStatus(clazz.status || "Active");
      setProfessor(clazz.professor || "");
      setRoom(clazz.room || "");
      setSchedule(clazz.schedule || "");
      setWifi(clazz.wifi || "");
    }
  }, [open, clazz]);

  if (!open || !clazz) return null;

  return (
    <div className="ecm-overlay" onMouseDown={onClose}>
      <div className="ecm-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ecm-top">
          <div className="ecm-titleBlock">
            <div className="ecm-title">{clazz.name}</div>
            <div className="ecm-code">{clazz.code}</div>
          </div>

          <div className="ecm-statusWrap">
            <span className={`ecm-pill ${status === "Active" ? "active" : "inactive"}`}>
              {status}
            </span>
            <select className="ecm-statusSelect" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="ecm-fields">
          <div className="ecm-line">
            <span className="ecm-ico">👤</span>
            <select className="ecm-select" value={professor} onChange={(e) => setProfessor(e.target.value)}>
              {profOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="ecm-line">
            <span className="ecm-ico">📍</span>
            <select className="ecm-select" value={room} onChange={(e) => setRoom(e.target.value)}>
              {roomOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="ecm-line">
            <span className="ecm-ico">🕒</span>
            <select className="ecm-select" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
              {scheduleOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="ecm-line wifi">
            <span className="ecm-ico">📶</span>
            <input
              className="ecm-input"
              value={wifi}
              onChange={(e) => setWifi(e.target.value)}
              placeholder="WiFi name"
            />
          </div>
        </div>

        <button
          className="ecm-save"
          type="button"
          onClick={() =>
            onSaveClick?.({
              ...clazz,
              status,
              professor,
              room,
              schedule,
              wifi,
            })
          }
        >
          Save
        </button>
      </div>
    </div>
  );
}
