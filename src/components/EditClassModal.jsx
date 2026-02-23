import React, { useEffect, useMemo, useState } from "react";
import "./EditClassModal.css";

/* Font Awesome */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLocationDot, faClock, faWifi } from "@fortawesome/free-solid-svg-icons";

export default function EditClassModal({
  open,
  clazz,
  allClasses,
  editBlockedReason,
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
  const [liveValidationError, setLiveValidationError] = useState("");

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
    return `${digits || raw.replace(/\s+/g, "")}`;
  };

  const dayOptions = useMemo(
    () => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    []
  );
  const roomOptionsByFloor = useMemo(
    () =>
      Array.from({ length: 4 }, (_, floorIdx) => {
        const floor = floorIdx + 1;
        const rooms = Array.from({ length: 10 }, (_, roomIdx) => `${floor}${String(roomIdx + 1).padStart(2, "0")}`);
        return { floor, rooms };
      }),
    []
  );
  const validRoomOptions = useMemo(
    () => new Set(roomOptionsByFloor.flatMap((f) => f.rooms)),
    [roomOptionsByFloor]
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

  const normalizeRoom = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  const normalizeRoomKey = (value) =>
    normalizeRoom(value)
      .replace(/^room\s*/i, "")
      .replace(/\s+/g, "");
  const toRoomOption = (value) => {
    const normalized = normalizeRoomKey(value);
    if (validRoomOptions.has(normalized)) return normalized;
    return "";
  };
  const roomQuery = normalizeRoom(room);
  const roomKey = normalizeRoomKey(room);

  const toMinutes = (value) => {
    const [hh, mm] = String(value || "").split(":");
    if (hh == null || mm == null) return null;
    const h = Number(hh);
    const m = Number(mm);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const roomScheduleMatches = useMemo(() => {
    if (!Array.isArray(allClasses) || !roomQuery) return [];

    return allClasses
      .filter((c) => {
        if (!c || c.id === clazz?.id) return false;
        const classRoom = normalizeRoom(c.room);
        if (!classRoom.includes(roomQuery)) return false;
        if (!dayOfWeek) return true;
        return dayName(c.day_of_week) === dayOfWeek;
      });
  }, [allClasses, roomQuery, dayOfWeek, clazz?.id]);

  const getValidationError = (nextRoom, nextDay, nextStart, nextEnd) => {
    if (!nextStart || !nextEnd) return "";

    const start = toMinutes(nextStart);
    const end = toMinutes(nextEnd);
    if (start == null || end == null) return "";
    if (end <= start) return "End time must be later than start time.";

    const nextRoomKey = normalizeRoomKey(nextRoom);
    if (!nextRoomKey || !nextDay || !Array.isArray(allClasses)) return "";

    const conflict = allClasses.find((c) => {
      if (!c || c.id === clazz?.id) return false;
      const classRoom = normalizeRoomKey(c.room);
      const classDay = dayName(c.day_of_week);
      if (classRoom !== nextRoomKey || classDay !== nextDay) return false;

      const currentStart = toMinutes(c.start_time);
      const currentEnd = toMinutes(c.end_time);
      if (currentStart == null || currentEnd == null) return false;

      return start < currentEnd && end > currentStart;
    });

    if (!conflict) return "";

    return `Schedule conflict: ${conflict.name || conflict.course || "Class"} is already scheduled on ${dayName(conflict.day_of_week)} (${formatTime12(conflict.start_time)} - ${formatTime12(conflict.end_time)}).`;
  };

  const isEditLocked = Boolean(editBlockedReason);
  const hasTimeError = Boolean(liveValidationError);

  useEffect(() => {
    if (open && clazz) {
      const next = {
        status: clazz.status || "Active",
        professor: clazz.professor || "",
        room: toRoomOption(clazz.room),
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
      setLiveValidationError("");

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
    setWifi(formatApName('ClassroomWifi'));
  }, [room]);

  useEffect(() => {
    setLiveValidationError(getValidationError(room, dayOfWeek, startTime, endTime));
  }, [room, dayOfWeek, startTime, endTime, allClasses, clazz?.id]);

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
        {editBlockedReason && (
          <div className="ecm-topError">{editBlockedReason}</div>
        )}

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
            <div className="ecm-fieldWrap">
              <select
                className="ecm-select"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                disabled={isEditLocked}
              >
                <option value="">Select room</option>
                {roomOptionsByFloor.map(({ floor, rooms }) => (
                  <optgroup key={floor} label={`${floor}${floor === 1 ? "st" : floor === 2 ? "nd" : floor === 3 ? "rd" : "th"} Floor`}>
                    {rooms.map((roomOption) => (
                      <option key={roomOption} value={roomOption}>
                        Room {roomOption}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="ecm-line">
            <span className="ecm-ico">
              <FontAwesomeIcon icon={faClock} />
            </span>
            <select
              className="ecm-select"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              disabled={isEditLocked}
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
            <div className="ecm-fieldWrap">
              <div className="ecm-timeInputs">
              <input
                className={`ecm-input ${hasTimeError ? "ecm-input-error" : ""}`}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isEditLocked}
              />
              <span className="ecm-timeSep">to</span>
              <input
                className={`ecm-input ${hasTimeError ? "ecm-input-error" : ""}`}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isEditLocked}
              />
              </div>
              {liveValidationError && <div className="ecm-errorText">{liveValidationError}</div>}
            </div>
          </div>

          <div className="ecm-line">
            <span className="ecm-ico">
              <FontAwesomeIcon icon={faWifi} />
            </span>
            <div className="ecm-static">{wifi || "No WiFi assigned"}</div>
          </div>
        </div>

        {roomQuery && roomScheduleMatches.length > 0 && (
          <div className="ecm-conflictWrap">
            <div className="ecm-conflictLabel">Room Schedule Conflicts</div>
            <div className="ecm-helpText ecm-conflictList">
              {roomScheduleMatches.map((c) => (
                <div className="ecm-conflictItem" key={c.id}>
                  {(c.name || c.course || "Unknown Course")} - {dayName(c.day_of_week)} ({formatTime12(c.start_time)} - {formatTime12(c.end_time)})
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Buttons (CENTER like student modal) */}
        <div className="ecm-actions">
          <button className="ecm-cancel" type="button" onClick={onClose}>
            Cancel
          </button>

          <button
            className={`ecm-save ${!changed || Boolean(liveValidationError) || Boolean(editBlockedReason) ? "disabled" : ""}`}
            type="button"
            disabled={!changed || Boolean(liveValidationError) || Boolean(editBlockedReason)}
            title={
              editBlockedReason
                ? editBlockedReason
                : liveValidationError
                ? liveValidationError
                : !changed
                  ? "Change something first"
                  : "Save changes"
            }
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

