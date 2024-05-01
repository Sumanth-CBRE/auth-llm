// src/Register.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';
import '../styles/Auth.css';

const Register = ({ switchToLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useContext(AuthContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Form validation
        if (formData.password !== formData.confirmPassword) {
            setMessage("Passwords don't match");
            setMessageType("error");
            return;
        }

        setLoading(true);
        setMessage('');
        
        try {
            const res = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: formData.username, 
                    email: formData.email, 
                    password: formData.password 
                }),
            });
            const data = await res.json();
            
            if (res.ok) {
                setMessage('Registration successful. You can now login.');
                setMessageType('success');
                // Reset form
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
                // Auto switch to login after 2 seconds
                setTimeout(() => {
                    if (switchToLogin) switchToLogin();
                }, 2000);
            } else {
                setMessage(data.detail || 'Registration failed');
                setMessageType('error');
            }
        } catch (err) {
            setMessage('Error registering user');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    // Always use string values for inputs
    const safeValue = (v) => (typeof v === "string" ? v : "");

    return (
        <div className="auth-container">
            <h2 className="auth-title">Create Account</h2>
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        className="form-control"
                        name="username"
                        placeholder="Username"
                        value={safeValue(formData.username)}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="email"
                        className="form-control"
                        name="email"
                        placeholder="Email"
                        value={safeValue(formData.email)}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        className="form-control"
                        name="password"
                        placeholder="Password"
                        value={safeValue(formData.password)}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        className="form-control"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={safeValue(formData.confirmPassword)}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Register'}
                </button>
                
                {message && (
                    <div className={`message ${messageType === 'success' ? 'message-success' : 'message-error'}`}>
                        {message}
                    </div>
                )}
            </form>
            
            <div className="auth-switch">
                Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); if (switchToLogin) switchToLogin(); }}>Login</a>
            </div>
        </div>
    );
};

export default Register;