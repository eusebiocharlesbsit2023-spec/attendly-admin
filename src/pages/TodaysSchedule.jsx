import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./TodaysSchedule.css";

export default function TodaysSchedule() {
  const navigate = useNavigate();

  const dateLabel = "Tuesday: January 6, 2026";

  const classes = [
    {
      status: "Class In-Progress",
      statusType: "inprogress",
      title: "Introduction to Computer Science",
      code: "CS101",
      professor: "Mrs. Sadie Mayers",
      room: "Room 303",
      time: "Monday: 9:00 - 11:00 AM",
      wifi: "Lab303_Wifi",
      students: 45,
    },
    {
      status: "Class In-Progress",
      statusType: "inprogress",
      title: "Introduction to Computer Science",
      code: "CS101",
      professor: "Mrs. Sadie Mayers",
      room: "Room 303",
      time: "Monday: 9:00 - 11:00 AM",
      wifi: "Lab303_Wifi",
      students: 45,
    },
    {
      status: "Class Ended",
      statusType: "ended",
      title: "Introduction to Computer Science",
      code: "CS101",
      professor: "Mrs. Sadie Mayers",
      room: "Room 303",
      time: "Monday: 9:00 - 11:00 AM",
      wifi: "Lab303_Wifi",
      students: 45,
    },
    {
      status: "On-going",
      statusType: "ongoing",
      title: "Introduction to Computer Science",
      code: "CS101",
      professor: "Mrs. Sadie Mayers",
      room: "Room 303",
      time: "Monday: 9:00 - 11:00 AM",
      wifi: "Lab303_Wifi",
      students: 45,
    },
  ];

  return (
    <div className="app-shell schedule">
      {/* Sidebar */}
      <Sidebar active="dashboard" />

      {/* Topbar */}
      <header className="schedule-topbar">
        <div className="schedule-topbar-inner">
          <div className="schedule-title">Today’s Schedule</div>

          <button className="icon-btn" onClick={() => navigate(-1)} title="Back">
            <Svg name="back" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="schedule-main">
        <div className="schedule-header">
          <div className="schedule-date">{dateLabel}</div>

          <button className="export-btn" type="button" onClick={() => window.print()}>
            <Svg name="download" small />
            Export PDF
          </button>
        </div>

        <section className="schedule-grid">
          {classes.map((c, idx) => (
            <div className="schedule-card" key={idx}>
              <div className={`status-pill ${c.statusType}`}>
  <span className="status-text">{c.status}</span>
</div>


              <div className="card-top">
                <div className="course-title">{c.title}</div>
                <div className="students-pill">{c.students} Students</div>
              </div>

              <div className="course-code">{c.code}</div>

              {/* ✅ NEW: wrap info rows so we can control vertical spacing */}
              <div className="card-body">
                <div className="info-row">
                  <Svg name="user" small />
                  <span>{c.professor}</span>
                </div>

                <div className="info-row">
                  <Svg name="pin" small />
                  <span>{c.room}</span>
                </div>

                <div className="info-row">
                  <Svg name="clock" small />
                  <span>{c.time}</span>
                </div>

                <div className="info-row">
                  <Svg name="wifi" small />
                  <span>{c.wifi}</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

/* ===== SVG HELPER ===== */
function Svg({ name, small = false }) {
  const s = small ? 16 : 22;
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none" };

  const icons = {
    back: <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    download: (
      <>
        <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M8 10l4 4 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    pin: <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0z" stroke="currentColor" strokeWidth="2" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    wifi: (
      <>
        <path d="M5 10a11 11 0 0114 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 13a7 7 0 018 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M11 16a3 3 0 012 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="19" r="1" fill="currentColor" />
      </>
    ),
  };

  return <svg {...props}>{icons[name]}</svg>;
}
