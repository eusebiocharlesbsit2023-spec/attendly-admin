import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import supabase from '../helper/supabaseClient';
import logo from '../assets/Logo.png';
import './AdminLogin.css'; // Reusing styles

export default function AdminRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const role = (searchParams.get('role') || 'admin').toLowerCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invitation token is missing.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc('verify_admin_invite', { p_token: token });
        if (rpcError) throw rpcError;

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
          setError('This invitation is invalid or has expired.');
        } else {
          setInviteData(row);
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while verifying your invitation.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!fullName || !password) {
      setError('Please fill all fields.');
      return;
    }
    if (role === 'admin' && !username) {
      setError('Please fill all fields.');
      return;
    }
    if (role === 'professor' && !department) {
      setError('Please fill all fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: inviteData?.email,
          password,
        });

        if (signUpError) throw signUpError;

        if (!signUpData?.user?.id) {
          throw new Error("Account creation failed. No user id returned.");
        }

        if (role === 'professor') {
          const { error: rpcError } = await supabase.rpc('register_invited_professor_profile', {
            p_token: token,
            p_full_name: fullName,
            p_department: department,
          });
          if (rpcError) throw rpcError;
        } else {
          const { error: rpcError } = await supabase.rpc('register_invited_admin_profile', {
            p_token: token,
            p_full_name: fullName,
            p_username: username,
          });
          if (rpcError) throw rpcError;
        }

        if (rpcError) throw rpcError;

        alert('Registration successful! You can now log in.');
        navigate('/'); // Redirect to login page
    } catch (err) {
        console.error('Registration failed:', err);
        setError(err.message || 'Registration failed. Please try again.');
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="login-container"><div>Verifying invitation...</div></div>;
  }

  if (error || !inviteData) {
    return (
      <div className="login-container">
        <div className="login-card">
          <img src={logo} alt="Logo" className="logo" />
          <h2>Admin Registration</h2>
          <p className="error-text">{error || 'Invalid invitation link.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="Logo" className="logo" />
          <h2>{role === 'professor' ? 'Create Your Professor Account' : 'Create Your Admin Account'}</h2>
          <p className="subtitle">Invited as {inviteData.email}</p>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="input-group"><input type="email" value={inviteData.email} disabled /></div>
          <div className="input-group"><input type="text" placeholder="Full Name" required value={fullName} onChange={e => setFullName(e.target.value)} disabled={submitting} /></div>
          {role === 'admin' && (
            <div className="input-group">
              <input type="text" placeholder="Username" required value={username} onChange={e => setUsername(e.target.value)} disabled={submitting} />
            </div>
          )}
          {role === 'professor' && (
            <div className="input-group">
              <input type="text" placeholder="Department" required value={department} onChange={e => setDepartment(e.target.value)} disabled={submitting} />
            </div>
          )}
          <div className="input-group"><input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} disabled={submitting} /></div>
          <div className="input-group"><input type="password" placeholder="Confirm Password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={submitting} /></div>
          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>
      </div>
    </div>
  );
}
