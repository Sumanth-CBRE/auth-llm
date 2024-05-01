// src/UserProfile.jsx
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Auth.css';

const UserProfile = () => {
  const { username, credits, logout, setCredits } = useContext(AuthContext);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [tokenUsesLeft, setTokenUsesLeft] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const getCreditBadgeClass = () => {
    if (credits >= 4) return 'high';
    if (credits >= 2) return 'medium';
    return 'low';
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setResponse('');
    setIsGenerating(true);
    
    try {
      const res = await fetch('/auth/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setResponse(data.response);
        setTokenUsesLeft(data.token_uses_left);
        // Update credits in context
        if (typeof data.credits_left === 'number') {
          setCredits(data.credits_left);
        }
      } else {
        setError(data.detail || 'Error generating response');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (!username) return <div>Please login.</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="user-info">
          <h2>Welcome, {username}</h2>
          <div>
            <span>Credits left: <span className={`credit-badge ${getCreditBadgeClass()}`}>{credits}</span></span>
            <span style={{ marginLeft: '1rem' }}>
              Token uses: {tokenUsesLeft}/5
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={logout} className="btn btn-danger">Logout</button>
        </div>
      </div>
      
      <div className="prompt-container">
        <h3>Generate with AI</h3>
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <textarea
              className="form-control"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              required
              disabled={credits <= 0 || tokenUsesLeft <= 0}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={credits <= 0 || tokenUsesLeft <= 0 || isGenerating || !prompt.trim()}
          >
            {isGenerating ? 'Generating...' : 'Generate Response'}
          </button>
          
          {credits <= 0 && (
            <div className="message message-error">
              You have no credits left. Please contact support to add more credits.
            </div>
          )}
          
          {tokenUsesLeft <= 0 && (
            <div className="message message-error">
              Token usage limit reached. Please logout and login again to get a new token.
            </div>
          )}
        </form>
      </div>
      
      {error && (
        <div className="message message-error">
          {error}
        </div>
      )}
      
      {response && (
        <div className="response-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div className="response-header">Response:</div>
            <button 
              onClick={copyToClipboard} 
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
            >
              {showCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{response}</div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;