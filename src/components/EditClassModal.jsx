import React, { useEffect, useMemo, useState } from "react";
import "./EditClassModal.css";

/* Font Awesome */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLocationDot, faClock, faWifi } from "@fortawesome/free-solid-svg-icons";

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

  const [original, setOriginal] = useState({
    status: "Active",
    professor: "",
    room: "",
    schedule: "",
    wifi: "",
  });

  const profOptions = useMemo(() => {
    const set = new Set((allClasses || []).map((c) => c.professor).filter(Boolean));
    return Array.from(set);
  }, [allClasses]);

  const roomOptions = useMemo(() => {
    const set = new Set((allClasses || []).map((c) => c.room).filter(Boolean));
    return Array.from(set);
  }, [allClasses]);

  const scheduleOptions = useMemo(() => {
    const set = new Set((allClasses || []).map((c) => c.schedule).filter(Boolean));
    return Array.from(set);
  }, [allClasses]);

  useEffect(() => {
    if (open && clazz) {
      const next = {
        status: clazz.status || "Active",
        professor: clazz.professor || "",
        room: clazz.room || "",
        schedule: clazz.schedule || "",
        wifi: clazz.wifi || "",
      };

      setStatus(next.status);
      setProfessor(next.professor);
      setRoom(next.room);
      setSchedule(next.schedule);
      setWifi(next.wifi);

      setOriginal(next);
    }
  }, [open, clazz]);

  const changed =
    status !== original.status ||
    professor !== original.professor ||
    room !== original.room ||
    schedule !== original.schedule ||
    wifi !== original.wifi;

  if (!open || !clazz) return null;

  return (
    <div className="ecm-overlay" onMouseDown={onClose}>
      <div className="ecm-card" onMouseDown={(e) => e.stopPropagation()}>
        {/* ===== Header ===== */}
        <div className="ecm-top">
          <div>
            <div className="ecm-title">{clazz.name}</div>
            <div className="ecm-code">{clazz.code}</div>
          </div>

          <div className="ecm-statusWrap">
            <select
              className="ecm-statusSelect"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Active">Activate</option>
              <option value="Inactive">Deactivate</option>
            </select>
          </div>
        </div>

        {/* ===== Fields ===== */}
        <div className="ecm-fields">
          <div className="ecm-line">
            <span className="ecm-ico">
              <FontAwesomeIcon icon={faUser} />
            </span>
            <select
              className="ecm-select"
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
            >
              {profOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="ecm-line">
            <span className="ecm-ico">
              <FontAwesomeIcon icon={faLocationDot} />
            </span>
            <select
              className="ecm-select"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            >
              {roomOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="ecm-line">
            <span className="ecm-ico">
              <FontAwesomeIcon icon={faClock} />
            </span>
            <select
              className="ecm-select"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            >
              {scheduleOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="ecm-line">
            <span className="ecm-ico">
              <FontAwesomeIcon icon={faWifi} />
            </span>

            <input
              className="ecm-input"
              value={wifi}
              onChange={(e) => setWifi(e.target.value)}
              placeholder="Lab WiFi name"
            />
          </div>
        </div>

        {/* ✅ Buttons (CENTER like student modal) */}
        <div className="ecm-actions">
          <button className="ecm-cancel" type="button" onClick={onClose}>
            Cancel
          </button>

          <button
            className={`ecm-save ${!changed ? "disabled" : ""}`}
            type="button"
            disabled={!changed}
            title={!changed ? "Change something first" : "Save changes"}
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
    </div>
  );
}
