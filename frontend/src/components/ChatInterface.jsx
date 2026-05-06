import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, Send, Square, AlertTriangle } from 'lucide-react';

const ChatInterface = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/chat/history', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const currentText = text;
      setText('');
      
      const { data } = await axios.post('http://localhost:5000/api/chat/text', { text: currentText }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setMessages(prev => [...prev, data]);
    } catch (err) {
      console.error(err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = e => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await sendAudio(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const sendAudio = async (blob) => {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');

    try {
      const { data } = await axios.post('http://localhost:5000/api/chat/voice', formData, {
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessages(prev => [...prev, data]);
      
      // Show confirmation message
      setRecordingStatus('Your voice has been successfully recorded and analyzed!');
      setTimeout(() => setRecordingStatus(''), 3000);
      
    } catch (err) {
      console.error(err);
    }
  };

  const getEmotionColor = (emotion) => {
    const map = {
      joy: 'var(--success)', happy: 'var(--success)',
      sadness: '#3b82f6', sad: '#3b82f6',
      anger: 'var(--danger)', angry: 'var(--danger)',
      fear: '#8b5cf6', fearful: '#8b5cf6',
      disgust: '#a855f7',
      surprised: '#f59e0b',
      calm: '#0ea5e9',
      neutral: 'var(--text-muted)'
    };
    return map[emotion] || 'var(--text-muted)';
  };

  return (
    <div className="glass-panel" style={{ height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h2>My Safe Space</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Express yourself freely. The AI analyzes your emotions.</p>
        
        {recordingStatus && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: 'rgba(16, 185, 129, 0.2)', 
            border: '1px solid var(--success)', 
            borderRadius: '8px',
            color: 'var(--success)',
            fontSize: '0.9rem',
            animation: 'fadeIn 0.3s ease-in-out'
          }}>
            {recordingStatus}
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, idx) => (
          <React.Fragment key={msg._id || idx}>
            <div style={{ alignSelf: 'flex-end', maxWidth: '70%' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.2)',
                padding: '1rem',
                borderRadius: '16px 16px 0 16px',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                {msg.text && <p>{msg.text}</p>}
                {msg.audioUrl && <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>🎤 Voice message</p>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                {msg.isHighRisk && <AlertTriangle size={14} color="var(--danger)" />}
                <span style={{ color: getEmotionColor(msg.emotion) }}>
                  {msg.emotion ? msg.emotion.charAt(0).toUpperCase() + msg.emotion.slice(1) : 'Unknown'} ({(msg.confidence * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            {msg.isHighRisk && (
              <div key={`helpline-${idx}`} style={{
                alignSelf: 'flex-start', maxWidth: '80%',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '1rem',
                borderRadius: '16px 16px 16px 0',
                border: '1px solid var(--danger)',
                marginTop: '0.5rem'
              }}>
                <p style={{ fontWeight: 'bold', color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} /> Support is available
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  We noticed you might be going through a difficult time. Please remember you are not alone.
                  Consider reaching out to a professional or a helpline:
                </p>
                <ul style={{ fontSize: '0.9rem', marginTop: '0.5rem', paddingLeft: '1.5rem', color: 'var(--text-main)' }}>
                  <li>National Crisis Hotline: <strong>988</strong> (US)</li>
                  <li>Crisis Text Line: Text HOME to <strong>741741</strong></li>
                </ul>
              </div>
            )}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.5)' }}>
        <form onSubmit={handleSendText} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Type your thoughts..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={20} />
          </button>

          <button
            type="button"
            className={`btn ${isRecording ? 'btn-danger' : 'btn-outline'}`}
            style={{ padding: '0.75rem', background: isRecording ? 'var(--danger)' : 'transparent', color: isRecording ? 'white' : 'var(--primary-color)' }}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <Square size={20} /> : <Mic size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;