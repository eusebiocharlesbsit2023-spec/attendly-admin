import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AttendanceRecords from "./pages/AttendanceRecords";
import Maintenance from "./pages/Maintenance";
import StudentManagement from "./pages/Studentmanagement";
import ClassManagement from "./pages/ClassManagement";
import ProfessorManagement from "./pages/ProfessorManagement";




function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/attendance" element={<AttendanceRecords />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/classes" element={<ClassManagement />} />
        <Route path="/professors" element={<ProfessorManagement />} />




      </Routes>
    </BrowserRouter>
  );
}

export default App;
