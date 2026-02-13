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


function App() {
  return (
    <BrowserRouter>
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
