import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AttendanceRecords from "./pages/AttendanceRecords";
import Maintenance from "./pages/Maintenance";
import StudentManagement from "./pages/StudentManagement";
import ClassManagement from "./pages/ClassManagement";
import ProfessorManagement from "./pages/ProfessorManagement";
import SubjectManagement from "./pages/SubjectManagement";
import ManageAdmin from "./pages/ManageAdmin";
import Reports from "./pages/Reports";
import Dashboard_Wrapper from "./pages/Wrapper";
import AdminRegistration from "./pages/AdminRegistration";

import SuperAdminRoute from "./routes/SuperAdminRoute";
import TodaysSchedule from "./pages/TodaysSchedule";
import supabase from "./helper/supabaseClient";


function App() {
  const [reportToast, setReportToast] = useState(null);
  const toastTimerRef = useRef(null);
  const seenToastIdsRef = useRef(new Set());

  useEffect(() => {
    const showReportToast = (payload) => {
      const row = payload?.new || {};
      if (!row?.id) return;
      if (seenToastIdsRef.current.has(row.id)) return;
      seenToastIdsRef.current.add(row.id);

      setReportToast({
        id: row.id,
        userName: row.user_name || "Unknown user",
        subject: row.subject || "No subject",
      });

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setReportToast(null);
      }, 5000);
    };

    const channel = supabase
      .channel("support-request-toast")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_requests" },
        showReportToast
      )
      .subscribe();

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const closeReportToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setReportToast(null);
  };

  return (
    <BrowserRouter>
      {reportToast && (
        <div className="global-report-toast" role="status" aria-live="polite">
          <div className="global-report-toast-icon" aria-hidden="true">!</div>
          <div className="global-report-toast-content">
            <div className="global-report-toast-title">New support request received</div>
            <div className="global-report-toast-body">
              {reportToast.userName}: {reportToast.subject}
            </div>
          </div>
          <button
            type="button"
            className="global-report-toast-close"
            onClick={closeReportToast}
            aria-label="Close notification"
          >
            x
          </button>
          <div className="global-report-toast-progress" aria-hidden="true" />
        </div>
      )}
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="register" element={<AdminRegistration />} />
        <Route element={<Dashboard_Wrapper />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
        </Route>
        <Route path="/attendance" element={<AttendanceRecords />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/classes" element={<ClassManagement />} />
        <Route path="/professors" element={<ProfessorManagement />} />
        <Route path="/subjects" element={<SubjectManagement />} />
        <Route path="/manage-admin" element={<ManageAdmin />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/feedback" element={<Reports />} />
        <Route path="/reports/archive" element={<Reports />} />
        <Route path="/reports/class-archive" element={<Reports />} />

        <Route path="/schedule" element={<TodaysSchedule />} />
        <Route
  path="/manage-admin"
  element={
    <SuperAdminRoute>
      <ManageAdmin />
    </SuperAdminRoute>
  }
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;

