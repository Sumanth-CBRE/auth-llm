import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [username, setUsername] = useState(localStorage.getItem('username') || null);
    const [credits, setCredits] = useState(Number(localStorage.getItem('credits')) || 0);

    // Only call this ONCE after successful login with username/password
    const login = (accessToken, username, credits) => {
        setToken(accessToken);
        setUsername(username);
        setCredits(credits);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('username', username);
        localStorage.setItem('credits', credits);
    };

    const logout = () => {
        setToken(null);
        setUsername(null);
        setCredits(0);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('credits');
    };

    // Update credits both in state and localStorage
    const updateCredits = (newCredits) => {
        setCredits(newCredits);
        localStorage.setItem('credits', newCredits);
    };

    return (
        <AuthContext.Provider value={{ token, username, credits, login, logout, setCredits: updateCredits }}>
            {children}
        </AuthContext.Provider>
    );
};