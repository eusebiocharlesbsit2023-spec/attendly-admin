import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import supabase from '../helper/supabaseClient';
import logo from '../assets/Logo.png';
import './AdminLogin.css'; // Reusing styles

const YEAR_LEVELS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
];

const SECTIONS = ['A', 'B', 'C'];

const fieldErrStyle = { marginTop: '-8px', marginBottom: '10px', color: '#ef4444', fontSize: '12px' };

export default function AdminRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const role = (searchParams.get('role') || 'admin').toLowerCase();

  const [loading, setLoading] = useState(true);
  const [inviteError, setInviteError] = useState('');
  const [formError, setFormError] = useState('');
  const [inviteData, setInviteData] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [studentMiddleName, setStudentMiddleName] = useState('');
  const [studentSurname, setStudentSurname] = useState('');
  const [studentSuffix, setStudentSuffix] = useState('');
  const [studentDepartment, setStudentDepartment] = useState('');
  const [studentProgram, setStudentProgram] = useState('');
  const [studentYearLevel, setStudentYearLevel] = useState('');
  const [studentSection, setStudentSection] = useState('');
  const [studentNumber, setStudentNumber] = useState('');

  const [department, setDepartment] = useState('');
  const [departmentOptions, setDepartmentOptions] = useState([]);

  const [studentPrograms, setStudentPrograms] = useState([]);
  const [liveStudentNoError, setLiveStudentNoError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [studentStep, setStudentStep] = useState(1);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!token) {
      setInviteError('Invitation token is missing.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc('verify_user_invite', {
          p_token: token,
          p_user_type: role,
        });

        if (rpcError) {
          if (role === 'admin') {
            const { data: legacyData, error: legacyErr } = await supabase.rpc('verify_admin_invite', { p_token: token });
            if (legacyErr) throw legacyErr;
            const legacyRow = Array.isArray(legacyData) ? legacyData[0] : legacyData;
            if (!legacyRow) {
              setInviteError('This invitation is invalid or has expired.');
            } else {
              setInviteData(legacyRow);
            }
            return;
          }
          throw rpcError;
        }

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
          setInviteError('This invitation is invalid or has expired.');
        } else {
          setInviteData(row);
        }
      } catch (err) {
        console.error(err);
        setInviteError('An error occurred while verifying your invitation.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, role]);

  useEffect(() => {
    setStudentStep(1);
    setTouched({});
  }, [role, token]);

  useEffect(() => {
    if (role !== 'professor') return;

    const fetchDepartments = async () => {
      const { data, error: deptErr } = await supabase
        .from('subjects')
        .select('department')
        .not('department', 'is', null)
        .order('department', { ascending: true });

      if (deptErr) {
        console.error('Fetch departments failed:', deptErr);
        return;
      }

      const uniqueDepartments = Array.from(new Set((data || []).map((row) => String(row.department || '').trim()).filter(Boolean)));
      setDepartmentOptions(uniqueDepartments);
    };

    fetchDepartments();
  }, [role]);

  useEffect(() => {
    if (role !== 'student') return;

    const fetchPrograms = async () => {
      const { data, error: programErr } = await supabase
        .from('programs')
        .select('department, program_abbr, program_name')
        .order('department', { ascending: true });

      if (programErr) {
        console.error('Fetch programs failed:', programErr);
        return;
      }

      setStudentPrograms(data || []);
    };

    fetchPrograms();
  }, [role]);

  useEffect(() => {
    if (role !== 'student') return;

    const sn = studentNumber.trim().toUpperCase();
    if (!sn) {
      setLiveStudentNoError('');
      return;
    }

    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id')
          .eq('student_number', sn)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setLiveStudentNoError('Student number already exists.');
          return;
        }

        setLiveStudentNoError('');
      } catch (e) {
        console.error('Student number check failed:', e);
        setLiveStudentNoError('');
      }
    }, 350);

    return () => clearTimeout(t);
  }, [role, studentNumber]);

  const studentDepartmentOptions = useMemo(() => {
    return Array.from(new Set((studentPrograms || []).map((p) => String(p.department || '').trim()).filter(Boolean)));
  }, [studentPrograms]);

  const studentProgramOptions = useMemo(() => {
    return (studentPrograms || [])
      .filter((p) => String(p.department || '').trim() === studentDepartment)
      .map((p) => `${p.program_abbr} - ${p.program_name}`);
  }, [studentPrograms, studentDepartment]);

  const studentStep1Errors = {
    firstName: !firstName.trim() ? 'First name is required.' : '',
    surname: !studentSurname.trim() ? 'Surname is required.' : '',
  };

  const studentStep2Errors = {
    department: !studentDepartment ? 'Department is required.' : '',
    program: !studentProgram ? 'Program is required.' : '',
    yearLevel: !studentYearLevel ? 'Year level is required.' : '',
    section: !studentSection ? 'Section is required.' : '',
    studentNumber: !studentNumber.trim() ? 'Student number is required.' : liveStudentNoError,
  };

  const studentStep3Errors = {
    password: !password ? 'Password is required.' : '',
    confirmPassword: !confirmPassword ? 'Confirm password is required.' : password !== confirmPassword ? 'Passwords do not match.' : '',
  };

  const hasErrors = (obj) => Object.values(obj).some(Boolean);
  const showFieldError = (field, message) => Boolean(touched[field] && message);

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (role === 'student') {
      if (hasErrors(studentStep1Errors) || hasErrors(studentStep2Errors) || hasErrors(studentStep3Errors)) {
        setFormError('Please complete all required fields.');
        return;
      }
    } else {
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
      if (!firstName.trim() || !lastName.trim() || !password) {
        setFormError('Please fill all fields.');
        return;
      }
      if (role === 'professor' && !department) {
        setFormError('Please fill all fields.');
        return;
      }
    }

    setSubmitting(true);
    setFormError('');

    try {
      const studentLastName = `${studentSurname.trim()} ${studentSuffix.trim()}`.trim();
      const body = {
        token,
        user_type: role,
        first_name: firstName.trim(),
        last_name: role === 'student' ? studentLastName : lastName.trim(),
        middle_name: role === 'student' ? (studentMiddleName.trim() || null) : undefined,
        password,
        department: role === 'professor' ? department.trim() : role === 'student' ? studentDepartment.trim() : undefined,
        student_number: role === 'student' ? studentNumber.trim().toUpperCase() : undefined,
        program: role === 'student' ? studentProgram.trim() : undefined,
        year_level: role === 'student' ? studentYearLevel : undefined,
        section: role === 'student' ? studentSection : undefined,
      };

      const { data, error: fnError } = await supabase.functions.invoke('register-invited-admin', {
        body,
      });

      if (fnError) {
        const res = fnError.context?.response;
        if (res) {
          const raw = await res.text();
          try {
            const parsed = JSON.parse(raw);
            throw new Error(parsed?.message || parsed?.error || raw || 'Registration failed.');
          } catch {
            throw new Error(raw || fnError.message || 'Registration failed.');
          }
        }
        throw new Error(fnError.message || 'Registration failed.');
      }
      if (!data?.success) {
        throw new Error(data?.message || 'Registration failed.');
      }

      setSuccessOpen(true);
    } catch (err) {
      console.error('Registration failed:', err);
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentNext = () => {
    if (studentStep === 1) {
      if (hasErrors(studentStep1Errors)) {
        setFormError('Please complete all required fields.');
        return;
      }
      setFormError('');
      setStudentStep(2);
      return;
    }

    if (studentStep === 2) {
      if (hasErrors(studentStep2Errors)) {
        setFormError('Please complete all required fields.');
        return;
      }
      setFormError('');
      setStudentStep(3);
    }
  };

  if (loading) {
    return <div className="login-container"><div>Verifying invitation...</div></div>;
  }

  if (inviteError || !inviteData) {
    return (
      <div className="login-container">
        <div className="login-card">
          <img src={logo} alt="Logo" className="logo" />
          <h2>Admin Registration</h2>
          <p className="error-text">{inviteError || 'Invalid invitation link.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {successOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 3000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: '20px 24px',
              borderRadius: '10px',
              minWidth: '300px',
              textAlign: 'center',
              boxShadow: '0 10px 26px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ display: 'grid', placeItems: 'center', marginBottom: '6px' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="2" />
                <path d="M7 12.5L10.2 15.7L17 8.9" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {role === 'admin' ? (
              <>
                <p style={{ marginTop: '10px' }}>Account created successfully. You can now log in.</p>
                <button
                  type="button"
                  className="login-btn"
                  style={{ marginTop: '12px' }}
                  onClick={() => navigate('/')}
                >
                  GO TO LOGIN
                </button>
              </>
            ) : (
              <>
                <p style={{ marginTop: '10px' }}>Account created successfully.</p>
                <p style={{ marginTop: '4px', fontSize: '14px', color: '#475569' }}>
                  You can now log in to the app using your Student Number and password.
                </p>
              </>
            )}
          </div>
        </div>
      )}
      <div className="login-card">
        <img src={logo} alt="Logo" className="logo" />
        <h2>
          {role === 'professor'
            ? 'Create Your Professor Account'
            : role === 'student'
            ? 'Create Your Student Account'
            : 'Create Your Admin Account'}
        </h2>
        <p className="subtitle">Invited as {inviteData.email}</p>

        {formError && <p className="error-text">{formError}</p>}

        <form onSubmit={handleSubmit}>
          <div className="input-group"><input type="email" value={inviteData.email} disabled /></div>
          {role === 'student' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '12px', fontSize: '12px', fontWeight: 700 }}>
                <span style={{ color: studentStep === 1 ? '#003f7f' : '#94a3b8' }}>Personal</span>
                <span style={{ color: '#94a3b8' }}>-&gt;</span>
                <span style={{ color: studentStep === 2 ? '#003f7f' : '#94a3b8' }}>Academic</span>
                <span style={{ color: '#94a3b8' }}>-&gt;</span>
                <span style={{ color: studentStep === 3 ? '#003f7f' : '#94a3b8' }}>Account</span>
              </div>

              {studentStep === 1 ? (
                <>
                  <div className="input-group"><input type="text" placeholder="First Name" required value={firstName} onChange={e => { markTouched('firstName'); setFirstName(e.target.value); setFormError(''); }} disabled={submitting} /></div>
                  {showFieldError('firstName', studentStep1Errors.firstName) && <p style={fieldErrStyle}>{studentStep1Errors.firstName}</p>}
                  <div className="input-group"><input type="text" placeholder="Middle Name" value={studentMiddleName} onChange={e => setStudentMiddleName(e.target.value)} disabled={submitting} /></div>
                  <div className="input-group"><input type="text" placeholder="Surname" required value={studentSurname} onChange={e => { markTouched('studentSurname'); setStudentSurname(e.target.value); setFormError(''); }} disabled={submitting} /></div>
                  {showFieldError('studentSurname', studentStep1Errors.surname) && <p style={fieldErrStyle}>{studentStep1Errors.surname}</p>}
                  <div className="input-group"><input type="text" placeholder="Suffix" value={studentSuffix} onChange={e => setStudentSuffix(e.target.value)} disabled={submitting} /></div>
                  <button type="button" className="login-btn" onClick={handleStudentNext} disabled={submitting || successOpen}>
                    NEXT
                  </button>
                </>
              ) : studentStep === 2 ? (
                <>
                  <div className="input-group">
                    <select value={studentDepartment} onChange={(e) => { markTouched('studentDepartment'); setStudentDepartment(e.target.value); setStudentProgram(''); setFormError(''); }} disabled={submitting || studentDepartmentOptions.length === 0}>
                      <option value="">{studentDepartmentOptions.length === 0 ? 'No departments available' : 'Select Department'}</option>
                      {studentDepartmentOptions.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                  {showFieldError('studentDepartment', studentStep2Errors.department) && <p style={fieldErrStyle}>{studentStep2Errors.department}</p>}
                  <div className="input-group">
                    <select value={studentProgram} onChange={(e) => { markTouched('studentProgram'); setStudentProgram(e.target.value); setFormError(''); }} disabled={submitting || !studentDepartment}>
                      <option value="">{studentDepartment ? 'Select Program' : 'Select Department first'}</option>
                      {studentProgramOptions.map((program) => <option key={program} value={program}>{program}</option>)}
                    </select>
                  </div>
                  {showFieldError('studentProgram', studentStep2Errors.program) && <p style={fieldErrStyle}>{studentStep2Errors.program}</p>}
                  <div className="input-group">
                    <select value={studentYearLevel} onChange={(e) => { markTouched('studentYearLevel'); setStudentYearLevel(e.target.value); setFormError(''); }} disabled={submitting}>
                      <option value="">Select Year Level</option>
                      {YEAR_LEVELS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
                    </select>
                  </div>
                  {showFieldError('studentYearLevel', studentStep2Errors.yearLevel) && <p style={fieldErrStyle}>{studentStep2Errors.yearLevel}</p>}
                  <div className="input-group">
                    <select value={studentSection} onChange={(e) => { markTouched('studentSection'); setStudentSection(e.target.value); setFormError(''); }} disabled={submitting}>
                      <option value="">Select Section</option>
                      {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {showFieldError('studentSection', studentStep2Errors.section) && <p style={fieldErrStyle}>{studentStep2Errors.section}</p>}
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Student Number"
                      required
                      value={studentNumber}
                      onChange={(e) => { markTouched('studentNumber'); setStudentNumber(e.target.value.toUpperCase()); setFormError(''); }}
                      disabled={submitting}
                    />
                  </div>
                  {showFieldError('studentNumber', studentStep2Errors.studentNumber) && <p style={fieldErrStyle}>{studentStep2Errors.studentNumber}</p>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="login-btn" style={{ background: '#64748b' }} onClick={() => setStudentStep(1)} disabled={submitting || successOpen}>
                      BACK
                    </button>
                    <button type="button" className="login-btn" onClick={handleStudentNext} disabled={submitting || successOpen || !!liveStudentNoError}>
                      NEXT
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group password-group">
                    <input
                      className="password-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      required
                      value={password}
                      onChange={e => { markTouched('password'); setPassword(e.target.value); setFormError(''); }}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {showFieldError('password', studentStep3Errors.password) && <p style={fieldErrStyle}>{studentStep3Errors.password}</p>}
                  <div className="input-group password-group">
                    <input
                      className="password-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      required
                      value={confirmPassword}
                      onChange={e => { markTouched('confirmPassword'); setConfirmPassword(e.target.value); setFormError(''); }}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {showFieldError('confirmPassword', studentStep3Errors.confirmPassword) && <p style={fieldErrStyle}>{studentStep3Errors.confirmPassword}</p>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="login-btn" style={{ background: '#64748b' }} onClick={() => setStudentStep(2)} disabled={submitting || successOpen}>
                      BACK
                    </button>
                    <button type="submit" className="login-btn" disabled={submitting || successOpen || !!liveStudentNoError || hasErrors(studentStep3Errors)}>
                      {submitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="input-group"><input type="text" placeholder="First Name" required value={firstName} onChange={e => setFirstName(e.target.value)} disabled={submitting} /></div>
              <div className="input-group"><input type="text" placeholder="Last Name" required value={lastName} onChange={e => setLastName(e.target.value)} disabled={submitting} /></div>
              {role === 'professor' && (
                <div className="input-group">
                  <select
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={submitting || departmentOptions.length === 0}
                  >
                    <option value="">
                      {departmentOptions.length === 0 ? 'No departments available' : 'Select Department'}
                    </option>
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="input-group password-group">
                <input
                  className="password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <div className="input-group password-group">
                <input
                  className="password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <button type="submit" className="login-btn" disabled={submitting || successOpen}>
                {submitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.74-1.75 1.9-3.35 3.4-4.67" />
      <path d="M1 1l22 22" />
      <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5a3.5 3.5 0 0 0 2.47-5.97" />
      <path d="M14.47 14.47 9.53 9.53" />
      <path d="M12 4c5 0 9.27 3.89 11 8a11.6 11.6 0 0 1-2.28 3.95" />
    </svg>
  );
}

