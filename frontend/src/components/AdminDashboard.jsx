import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, AlertTriangle, Activity } from 'lucide-react';

const AdminDashboard = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, highRisk: 0 });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/chat/admin/users', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessages(data);
      
      // Calculate basic stats
      const uniqueUsers = new Set(data.map(m => m.user._id)).size;
      const highRiskCount = data.filter(m => m.isHighRisk).length;
      setStats({ totalUsers: uniqueUsers, highRisk: highRiskCount });
      
    } catch (err) {
      console.error(err);
    }
  };

  // Aggregate emotions
  const emotionCounts = messages.reduce((acc, msg) => {
    acc[msg.emotion] = (acc[msg.emotion] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(emotionCounts).map(key => ({
    name: key, value: emotionCounts[key]
  }));

  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#cbd5e1'];

  // Group patients
  const patientMap = {};
  messages.forEach(msg => {
    if (!msg.user) return;
    const uid = msg.user._id;
    if (!patientMap[uid]) {
      patientMap[uid] = {
        id: uid,
        username: msg.user.username,
        messageCount: 0,
        highRiskCount: 0,
        lastActive: msg.createdAt
      };
    }
    patientMap[uid].messageCount++;
    if (msg.isHighRisk) patientMap[uid].highRiskCount++;
    if (new Date(msg.createdAt) > new Date(patientMap[uid].lastActive)) {
      patientMap[uid].lastActive = msg.createdAt;
    }
  });
  const patientsList = Object.values(patientMap).sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '12px' }}>
            <Users color="var(--primary-color)" size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active Patients</p>
            <h2 style={{ fontSize: '2rem' }}>{stats.totalUsers}</h2>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
            <AlertTriangle color="var(--danger)" size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>High Risk Flags</p>
            <h2 style={{ fontSize: '2rem' }}>{stats.highRisk}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '12px' }}>
            <Activity color="var(--success)" size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Interactions</p>
            <h2 style={{ fontSize: '2rem' }}>{messages.length}</h2>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Overall Emotion Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', overflowY: 'auto', height: '400px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Recent Patient Flags</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.filter(m => m.isHighRisk).map((msg, i) => (
              <div key={i} style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)', borderRadius: '0 8px 8px 0' }}>
                <p style={{ fontWeight: 'bold' }}>{msg.user.username}</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>"{msg.text}"</p>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleString()}</span>
              </div>
            ))}
            {messages.filter(m => m.isHighRisk).length === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>No high risk flags detected.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Patient Details Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h3 style={{ marginBottom: '1rem' }}>Patient Roster</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Username</th>
              <th style={{ padding: '1rem' }}>Total Interactions</th>
              <th style={{ padding: '1rem' }}>High Risk Flags</th>
              <th style={{ padding: '1rem' }}>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {patientsList.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.username}</td>
                <td style={{ padding: '1rem' }}>{p.messageCount}</td>
                <td style={{ padding: '1rem', color: p.highRiskCount > 0 ? 'var(--danger)' : 'inherit' }}>
                  {p.highRiskCount > 0 ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={14}/> {p.highRiskCount}</span> : p.highRiskCount}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(p.lastActive).toLocaleString()}</td>
              </tr>
            ))}
            {patientsList.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No patients found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminDashboard;
