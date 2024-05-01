import React, {useState} from 'react';
import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import {AuthProvider, AuthContext} from './contexts/AuthContext.jsx';
import Register from './components/Register.jsx';
import Login from './components/Login.jsx';
import UserProfile from './components/UserProfile.jsx';
import './styles/Auth.css';

const App = () => {
    return (
        <AuthProvider>
            <div className="app-container">
                <header className="app-header">
                    <h1 style={{textAlign: 'center', margin: '1.5rem 0', color: '#333'}}>AI Prompt Generator</h1>
                </header>
                <MainContent />
            </div>
        </AuthProvider>
    );
};

const MainContent = () => {
    const {token} = React.useContext(AuthContext);
    const [showLogin, setShowLogin] = useState(true);
    if (!token) {
        return (
            <div>
                {showLogin ? (
                    <Login switchToRegister={() => setShowLogin(false)} />
                ) : (
                    <Register switchToLogin={() => setShowLogin(true)} />
                )}
            </div>
        );
    }
    return <UserProfile />;
};

export default App;