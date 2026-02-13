import React, { useEffect, useState } from "react";
import "./AddSubjectModal.css";
import supabase from "../helper/supabaseClient";
import SmallConfirmModal from "./SmallConfirmModal";

export default function AddProgramModal({ open, onClose, onSubmit, departments = [], error = "" }) {
  const [department, setDepartment] = useState("");
  const [abbr, setAbbr] = useState("");
  const [programName, setProgramName] = useState("");
  const [liveAbbrError, setLiveAbbrError] = useState("");
  const [liveNameError, setLiveNameError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDepartment("");
    setAbbr("");
    setProgramName("");
    setLiveAbbrError("");
    setLiveNameError("");
    setConfirmOpen(false);
    setSaving(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dept = department.trim();
    const code = abbr.trim().toUpperCase();
    const name = programName.trim();

    if (!dept || (!code && !name)) {
      setLiveAbbrError("");
      setLiveNameError("");
      return;
    }

    const t = setTimeout(async () => {
      try {
        const { data, error: existsErr } = await supabase
          .from("programs")
          .select("id, program_abbr, program_name")
          .or(`program_abbr.eq.${code || " "},program_name.eq.${name || " "}`)
          .limit(1);

        if (existsErr) throw existsErr;
        if (data && data.length > 0) {
          const dup = data[0];
          setLiveAbbrError(code && dup.program_abbr === code ? "Program abbreviation already exists." : "");
          setLiveNameError(name && dup.program_name === name ? "Program name already exists." : "");
          return;
        }
        setLiveAbbrError("");
        setLiveNameError("");
      } catch {
        setLiveAbbrError("");
        setLiveNameError("");
      }
    }, 350);

    return () => clearTimeout(t);
  }, [open, department, abbr, programName]);

  const submit = (e) => {
    e.preventDefault();
    if (saving) return;
    if (!department.trim() || !abbr.trim() || !programName.trim()) return;
    if (liveAbbrError || liveNameError) return;
    setConfirmOpen(true);
  };

  const createYes = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const ok = await onSubmit?.({
        department: department.trim(),
        programAbbr: abbr.trim().toUpperCase(),
        programName: programName.trim(),
      });
      if (ok) setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="asm-overlay" onMouseDown={onClose}>
      <div className="asm-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="asm-title">Add Program</div>
        {error ? <div className="asm-errorText">{error}</div> : null}

        <form className="asm-form" onSubmit={submit}>
          <div className="asm-field">
            <label>Department</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Select or type department"
              list="apm-departments"
              disabled={saving}
            />
            <datalist id="apm-departments">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div className="asm-field">
            <label>Program Abbreviation</label>
            <input
              className={liveAbbrError ? "asm-input-error" : ""}
              value={abbr}
              onChange={(e) => setAbbr(e.target.value.toUpperCase())}
              placeholder="e.g. BSIT"
              disabled={saving}
            />
            {liveAbbrError ? <div className="asm-errorText field">{liveAbbrError}</div> : null}
          </div>
          <div className="asm-field">
            <label>Program Name</label>
            <input
              className={liveNameError ? "asm-input-error" : ""}
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g. Bachelor of Science in Information Technology"
              disabled={saving}
            />
            {liveNameError ? <div className="asm-errorText field">{liveNameError}</div> : null}
          </div>

          <div className="asm-actions">
            <button className="asm-btn primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Program"}
            </button>
            <button className="asm-btn" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
        <SmallConfirmModal
          open={confirmOpen}
          title={saving ? "Saving..." : `Add Program ${abbr.trim().toUpperCase()}?`}
          onYes={createYes}
          onCancel={() => !saving && setConfirmOpen(false)}
        />
      </div>
    </div>
  );
}
