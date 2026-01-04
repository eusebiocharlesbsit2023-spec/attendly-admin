import React, { useEffect, useState } from "react";
import "./AddProfessorModal.css";

export default function AddProfessorModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dept, setDept] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setDept("");
      setPass("");
      setConfirm("");
      setShowPass(false);
      setShowConfirm(false);
    }
  }, [open]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSubmit?.({
      name: name.trim(),
      email: email.trim(),
      department: dept.trim(),
      password: pass,
      confirmPassword: confirm,
    });
  };

  return (
    <div className="apm-overlay" onMouseDown={onClose}>
      <div className="apm-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="apm-title">Add New Professor</div>

        <form className="apm-form" onSubmit={submit}>
          <div className="apm-field">
            <label>Professor Name <span>*</span></label>
            <input
              placeholder="Enter Professor name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="apm-field">
            <label>Email</label>
            <input
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="apm-field">
            <label>Password</label>
            <div className="apm-passWrap">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter Password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <button type="button" className="apm-eye" onClick={() => setShowPass((v) => !v)}>
                👁
              </button>
            </div>
          </div>

          <div className="apm-field">
            <label>Confirm Password</label>
            <div className="apm-passWrap">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Enter Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button type="button" className="apm-eye" onClick={() => setShowConfirm((v) => !v)}>
                👁
              </button>
            </div>
          </div>

          <div className="apm-field">
            <label>Department <span>*</span></label>
            <input
              placeholder="Enter Department"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            />
          </div>

          <div className="apm-actions">
            <button className="apm-btn primary" type="submit">Add</button>
            <button className="apm-btn" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
