import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import logo from "../assets/Logo.png";

function AdminLogin() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    
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
            <input type="text" placeholder="Admin username" required />
          </div>

          <div className="input-group">
            <input type="password" placeholder="Password" required />
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
