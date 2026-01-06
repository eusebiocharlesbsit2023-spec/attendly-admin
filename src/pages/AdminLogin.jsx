import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import logo from "../assets/Logo.png";

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");


  const accounts = [
    { id: "ADM1", fullName: "John Doe", username: "admin1", role: "Admin", status: "Active", password: "admin1" },
    { id: "ADM2", fullName: "Jane Smith", username: "admin2", role: "Super Admin", status: "Active", password: "admin2" },
    { id: "ADM3", fullName: "Michael Johnson", username: "admin3", role: "Admin", status: "Inactive", password: "admin3" },
    { id: "ADM4", fullName: "Sarah Brown", username: "admin4", role: "Admin", status: "Active", password: "admin4" },
    { id: "ADM5", fullName: "Emily Clark", username: "admin5", role: "Admin", status: "Active", password: "admin5" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    const u = username.trim();
    const p = password;

    const found = accounts.find((a) => a.username === u && a.password === p);

    if (!found) {
      alert("Invalid username or password.");
      return;
    }

    if (found.status !== "Active") {
      alert("Your account is Inactive. Please contact the Super Admin.");
      return;
    }

    // ✅ Save logged-in info (used by Sidebar + route protection)
    localStorage.setItem("admin_id", found.id);
    localStorage.setItem("admin_name", found.fullName);
    localStorage.setItem("username", found.username);
    localStorage.setItem("role", found.role); // "Admin" or "Super Admin"

    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="Logo" className="logo" />

        <h2>ADMIN PORTAL</h2>
        <p className="subtitle">Sign in to access admin dashboard</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Admin username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn">
            SIGN IN
          </button>
        </form>

        <div className="info-box">
          <span className="info-icon">ℹ</span>
          <p>
            This is a restricted area for authorized administrators only.
            All login attempts are monitored and logged for security.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
