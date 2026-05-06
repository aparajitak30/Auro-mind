import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { username, password } : { username, password, role };
      
      const { data } = await axios.post(`http://localhost:5000${endpoint}`, payload);
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="auth-container glass-panel">
      <h2>{isLogin ? 'Welcome Back' : 'Join AuraMind'}</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        {isLogin ? 'Login to continue your journey' : 'Start your mental wellness journey today'}
      </p>
      
      {error && <div className="error-msg">{error}</div>}
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {!isLogin && (
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white' }}
          >
            <option value="user">User (Patient)</option>
            <option value="admin">Admin (Psychologist)</option>
          </select>
        )}
        
        <button type="submit" className="btn btn-primary">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
      
      <p style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <span 
          style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Sign up' : 'Login'}
        </span>
      </p>
    </div>
  );
};

export default Login;
