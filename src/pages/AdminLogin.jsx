import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import logo from "../assets/Logo.png";
import supabase from "../helper/supabaseClient";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  // ✅ NEW: loading after clicking login
  const [loggingIn, setLoggingIn] = useState(false);

  // 🔐 redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // optional: require profile too before redirect
      const p = localStorage.getItem("adminProfile");
      if (session && p) {
        navigate("/dashboard", { replace: true });
      } else {
        setCheckingSession(false);
      }
    });
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setLoggingIn(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password,
        });

      const user = authData?.user;

      if (authError || !user) {
        setErrorMessage(authError?.message || "Login failed.");
        return;
      }

      // ✅ fetch profile first
      const { data: profile, error: profileError } = await supabase
        .from("admins")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setErrorMessage(profileError?.message || "Admin profile not found.");
        await supabase.auth.signOut(); // optional cleanup
        return;
      }

      // ✅ store then navigate
      localStorage.setItem("adminProfile", JSON.stringify(profile));
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setErrorMessage(e?.message || "Something went wrong.");
    } finally {
      setLoggingIn(false);
    }
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
              placeholder="Admin email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loggingIn}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loggingIn}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loggingIn}>
            {loggingIn ? "SIGNING IN..." : "SIGN IN"}
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

      {/* ✅ Optional overlay loader */}
      {loggingIn && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "18px 22px",
              borderRadius: 12,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              textAlign: "center",
              minWidth: 240,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Signing in</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              Please wait...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLogin;
