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
  const [loggingIn, setLoggingIn] = useState(false);

  // ✅ password visibility
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
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

      const { data: profile, error: profileError } = await supabase
        .from("admins")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setErrorMessage(profileError?.message || "Admin profile not found.");
        await supabase.auth.signOut();
        return;
      }

      localStorage.setItem("adminProfile", JSON.stringify(profile));
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setErrorMessage(e?.message || "Something went wrong.");
    } finally {
      setLoggingIn(false);
    }
  };

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

          <div className="input-group password-group">
            <input
              className="password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loggingIn}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
            >
              {showPassword ? (
                /* eye-off */
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.74-1.75 1.9-3.35 3.4-4.67" />
                  <path d="M1 1l22 22" />
                  <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5a3.5 3.5 0 0 0 2.47-5.97" />
                  <path d="M14.47 14.47 9.53 9.53" />
                  <path d="M12 4c5 0 9.27 3.89 11 8a11.6 11.6 0 0 1-2.28 3.95" />
                </svg>
              ) : (
                /* eye */
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
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
            <div style={{ fontSize: 13, opacity: 0.8 }}>Please wait...</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLogin;
