import React, { useMemo, useState } from "react";
import "./CreateAdminModal.css";

/* FontAwesome (eye icons) */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { supabaseCreateUser } from "../helper/supabaseCreateUserClient";
import supabase from "../helper/supabaseClient";

export default function CreateAdminModal({ open, onClose, onCreate }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("Admin");
  const [tempPassword, setTempPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const errors = useMemo(() => {
    const e = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!username.trim()) e.username = "Username is required";
    if (!tempPassword.trim()) e.tempPassword = "Temporary password is required";
    if (tempPassword.trim() && tempPassword.trim().length < 6) e.tempPassword = "Min 6 characters";
    return e;
  }, [fullName, username, tempPassword]);

  const canSubmit = Object.keys(errors).length === 0;

  const reset = () => {
    setFullName("");
    setUsername("");
    setRole("Admin");
    setTempPassword("");
    setShowPass(false);
    setSubmitted(false); // 👈 reset validation state
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const { data: authData, error: authError } = await supabaseCreateUser.auth.signUp({
      email: `${username.trim()}.com`,
      password: tempPassword,
    });

    const adminID = authData.user.id;

    // after insert to admins:
    const { data: prof, error: profErr } = await supabase
      .from("admins")
      .insert({
        id: adminID,          // auth.users.id
        admin_name: fullName,
        username,
        role,
        status: "Active",
      })
      .select("*")
      .single();

    if (profErr) {
      console.log(profErr);
      return;
    }

    if(authError){
      setErrorMessage(authError.message);
      console.log(authError.message);
    }
    
    if(authData){
      setSubmitted(true); // mark that user tried to submit
      handleClose();
    }

    // ✅ pass saved row back to parent
    onCreate?.({
      uuid: prof.id,
      fullName: prof.admin_name,
      username: prof.username,
      role: prof.role,
      status: prof.status,
    });

    // ✅ close modal
    onClose?.();
  };


  if (!open) return null;

  return (
    <div className="cam-overlay" onMouseDown={handleClose}>
      <div className="cam-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cam-title">Create New Admin</div>

        <form onSubmit={handleSubmit} className="cam-form">
          <p className="error-text">{errorMessage}</p>
          {/* Full Name */}
          <label className="cam-label">
            Full Name <span className="cam-req">*</span>
          </label>
          <input
            className={`cam-input ${submitted && errors.fullName ? "err" : ""}`}
            placeholder="Enter Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          {submitted && errors.fullName && (
            <div className="cam-error">{errors.fullName}</div>
          )}

          {/* Username */}
          <label className="cam-label">
            Username <span className="cam-req">*</span>
          </label>
          <input
            className={`cam-input ${submitted && errors.username ? "err" : ""}`}
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {submitted && errors.username && (
            <div className="cam-error">{errors.username}</div>
          )}


          {/* Role (Admin only) */}
          <label className="cam-label">Role</label>
          <select className="cam-input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Admin">Admin</option>
          </select>

          {/* Temporary Password */}
          <label className="cam-label">
            Temporary Password <span className="cam-req">*</span>
          </label>
          <div className={`cam-passWrap ${submitted && errors.tempPassword ? "err" : ""}`}>
            <input
              className="cam-pass"
              type={showPass ? "text" : "password"}
              placeholder="Enter Temporary Password"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
            />
          </div>

          {submitted && errors.tempPassword && (
            <div className="cam-error">{errors.tempPassword}</div>
          )}

          {/* Buttons */}
          <div className="cam-actions">
            <button type="submit" className="cam-btn primary" disabled={!canSubmit}>
              Add
            </button>
            <button type="button" className="cam-btn" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
