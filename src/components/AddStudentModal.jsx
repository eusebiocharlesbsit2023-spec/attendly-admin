import React, { useMemo, useState } from "react";
import "./AddStudentModal.css";

export default function AddStudentModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [section, setSection] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (!name.trim()) e.name = "";
    if (!studentId.trim()) e.studentId = "";
    if (password.trim().length < 6) e.password = "";
    if (confirmPassword !== password) e.confirmPassword = "";
    return e;
  }, [name, studentId, password, confirmPassword]);

  const canSubmit = Object.keys(errors).length === 0;

  const reset = () => {
    setName("");
    setStudentId("");
    setPassword("");
    setConfirmPassword("");
    setYearLevel("");
    setSection("");
    setShowPass(false);
    setShowConfirm(false);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit?.({
      name: name.trim(),
      studentId: studentId.trim(),
      password,
      yearLevel: yearLevel.trim(),
      section: section.trim(),
    });

    handleClose();
  };

  if (!open) return null;

  return (
    <div className="asm-overlay" onMouseDown={handleClose}>
      <div className="asm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="asm-title">Add New Student</div>

        <form className="asm-form" onSubmit={handleSubmit}>
          <label className="asm-label">
            Student Name <span className="asm-req">*</span>
          </label>
          <input
            className={`asm-input ${errors.name ? "err" : ""}`}
            placeholder="Enter Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <div className="asm-error">{errors.name}</div>}

          <label className="asm-label">
            Student ID <span className="asm-req">*</span>
          </label>
          <input
            className={`asm-input ${errors.studentId ? "err" : ""}`}
            placeholder="Enter Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
          {errors.studentId && <div className="asm-error">{errors.studentId}</div>}

          <label className="asm-label">Password</label>
          <div className={`asm-passWrap ${errors.password ? "err" : ""}`}>
            <input
              className="asm-pass"
              type={showPass ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="asm-eye" onClick={() => setShowPass((v) => !v)}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
          {errors.password && <div className="asm-error">{errors.password}</div>}

          <label className="asm-label">Confirm Password</label>
          <div className={`asm-passWrap ${errors.confirmPassword ? "err" : ""}`}>
            <input
              className="asm-pass"
              type={showConfirm ? "text" : "password"}
              placeholder="Enter Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="button" className="asm-eye" onClick={() => setShowConfirm((v) => !v)}>
              {showConfirm ? "🙈" : "👁️"}
            </button>
          </div>
          {errors.confirmPassword && <div className="asm-error">{errors.confirmPassword}</div>}

          <label className="asm-label">Year Level</label>
          <input
            className="asm-input"
            placeholder="Enter Year Level"
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
          />

          <label className="asm-label">Section</label>
          <input
            className="asm-input"
            placeholder="Enter Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          />

          <div className="asm-actions">
            <button className="asm-btn primary" type="submit" disabled={!canSubmit}>
              Add
            </button>
            <button className="asm-btn" type="button" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
