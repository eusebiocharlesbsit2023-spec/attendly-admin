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
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [wifi, setWifi] = useState("");

  const [original, setOriginal] = useState({
    status: "Active",
    professor: "",
    room: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    wifi: "",
  });

  const formatApName = (roomName) => {
    const raw = String(roomName || "").trim();
    if (!raw) return "";
    const digits = raw.match(/\d+/g)?.join("") || "";
    return `AP${digits || raw.replace(/\s+/g, "")}`;
  };

  const dayOptions = useMemo(
    () => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    []
  );

  const dayName = (d) => {
    const map = {
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
      sun: "Sunday",
    };
    const key = String(d ?? "").toLowerCase().slice(0, 3);
    return map[key] || d || "";
  };

  const formatTime12 = (t) => {
    if (!t) return "";
    const [hh, mm] = String(t).split(":");
    let h = Number(hh);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${mm} ${ampm}`.trim();
  };

  useEffect(() => {
    if (open && clazz) {
      const next = {
        status: clazz.status || "Active",
        professor: clazz.professor || "",
        room: clazz.room || "",
        dayOfWeek: dayName(clazz.day_of_week) || "",
        startTime: clazz.start_time || "",
        endTime: clazz.end_time || "",
        wifi: clazz.wifi || "",
      };

      setStatus(next.status);
      setProfessor(next.professor);
      setRoom(next.room);
      setDayOfWeek(next.dayOfWeek);
      setStartTime(next.startTime);
      setEndTime(next.endTime);
      setWifi(next.wifi);

      setOriginal(next);
    }
  }, [open, clazz]);

  const changed =
    status !== original.status ||
    room !== original.room ||
    dayOfWeek !== original.dayOfWeek ||
    startTime !== original.startTime ||
    endTime !== original.endTime;

  useEffect(() => {
    setWifi(formatApName(room));
  }, [room]);

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
        </div>

        {/* ===== Fields ===== */}
        <div className="ecm-fields">
          <div className="ecm-line">
            <span className="ecm-ico">
              <FontAwesomeIcon icon={faUser} />
            </span>
            <div className="ecm-static">{professor || "Unassigned"}</div>
          </div>

          <div className="ecm-line">
            <span className="ecm-ico">
              <FontAwesomeIcon icon={faLocationDot} />
            </span>
            <input
              className="ecm-input"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Room"
            />
          </div>

          <div className="ecm-line">
            <span className="ecm-ico">
              <FontAwesomeIcon icon={faClock} />
            </span>
            <select
              className="ecm-select"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
            >
              <option value="">Select day</option>
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="ecm-line ecm-timeRow">
            <span className="ecm-ico">
              <FontAwesomeIcon icon={faClock} />
            </span>
            <div className="ecm-timeInputs">
              <input
                className="ecm-input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <span className="ecm-timeSep">to</span>
              <input
                className="ecm-input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="ecm-line">
            <span className="ecm-ico">
              <FontAwesomeIcon icon={faWifi} />
            </span>
            <div className="ecm-static">{wifi || "No WiFi assigned"}</div>
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
                  day_of_week: dayOfWeek,
                  start_time: startTime,
                  end_time: endTime,
                  schedule: `${dayName(dayOfWeek)}: ${formatTime12(startTime)} - ${formatTime12(endTime)}`.trim(),
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
