import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ChatInterface from './components/ChatInterface';
import AdminDashboard from './components/AdminDashboard';
import './App.css'; // specific app styles if needed

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <div className="app-wrapper">
        <header className="glass-panel" style={{ padding: '1rem 2rem', margin: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AuraMind
          </h1>
          {user && (
            <div>
              <span style={{ marginRight: '1rem' }}>Welcome, {user.username}</span>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  localStorage.removeItem('userInfo');
                  setUser(null);
                  window.location.href = '/';
                }}
              >
                Logout
              </button>
            </div>
          )}
        </header>

        <main className="container">
          <Routes>
            <Route path="/" element={!user ? <Login setUser={setUser} /> : (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/chat" />)} />
            <Route path="/chat" element={user ? <ChatInterface user={user} /> : <Navigate to="/" />} />
            <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
