import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import logo from "../assets/Logo.png";
import supabase from "../helper/supabaseClient";

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  // 🔐 redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      } else {
        setCheckingSession(false);
      }
    });
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${username}.com`,
      password,
    });

    const user = authData.user;

    if (authError || !user) {
      setErrorMessage(authError.message);
      return;
    }

    if (authData?.session) {
      navigate("/dashboard", { replace: true });
    }

    const userID = user.id;

    const { data: profile, error: profileError,} = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userID)
      .single();
    
    if(profileError){
      setErrorMessage(profileError.message)
    } else{
      localStorage.setItem('adminProfile', JSON.stringify(profile));
    }

    navigate('/dashboard');
  };

  // prevent login page flash
  if (checkingSession) return null;

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="Logo" className="logo" />

        <h2>ADMIN PORTAL</h2>
        <p className="subtitle">Sign in to access admin dashboard</p>

        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Admin username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
