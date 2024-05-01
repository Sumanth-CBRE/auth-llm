// src/Login.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Login = ({ switchToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            // Use application/x-www-form-urlencoded for OAuth2
            const formBody = new URLSearchParams();
            formBody.append('username', username);
            formBody.append('password', password);
            const res = await fetch('/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody.toString(),
            });
            const data = await res.json();
            if (res.ok && data.access_token) {
                setMessage('Login successful! Redirecting...');
                setMessageType('success');
                // Only call login ONCE with username/password, never with token
                login(data.access_token, username, data.credits || 5); // fallback credits
            } else {
                setMessage(data.detail || 'Login failed. Please check your credentials.');
                setMessageType('error');
            }
        } catch (err) {
            setMessage('Error logging in. Please try again.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="auth-title">Welcome Back</h2>
            <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Username"
                        value={username || ''}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Password"
                        value={password || ''}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                
                {message && (
                    <div className={`message ${messageType === 'success' ? 'message-success' : 'message-error'}`}>
                        {message}
                    </div>
                )}
            </form>
            
            <div className="auth-switch">
                Need an account? <a href="#" onClick={(e) => { e.preventDefault(); if (switchToRegister) switchToRegister(); }}>Register</a>
            </div>
        </div>
    );
};

export default Login;