import React, { useState } from 'react';
import './ProfileManager.css';

const ProfileManager = ({ onGameStart, onProfileSelect, initialTab = 'login' }) => {
  const [showLogin, setShowLogin] = useState(initialTab === 'login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Get stored users
    const users = JSON.parse(localStorage.getItem('plpakUsers') || '[]');
    const user = users.find(u => u.username === formData.username);

    if (!user) {
      setError('User not found. Please register first.');
      return;
    }

    if (user.password !== formData.password) {
      setError('Incorrect password');
      return;
    }

    // Login successful
    localStorage.setItem('plpakUser', JSON.stringify(user));
    onGameStart('login', user);
    setFormData({ username: '', password: '', confirmPassword: '' });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    // Get stored users
    const users = JSON.parse(localStorage.getItem('plpakUsers') || '[]');
    
    // Check if username already exists
    if (users.find(u => u.username === formData.username)) {
      setError('Username already exists');
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      username: formData.username,
      password: formData.password,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0
      },
      createdAt: new Date().toISOString()
    };

    // Save user
    users.push(newUser);
    localStorage.setItem('plpakUsers', JSON.stringify(users));
    
    // Auto-login
    localStorage.setItem('plpakUser', JSON.stringify(newUser));
    onGameStart('register', newUser);
    setFormData({ username: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="profile-manager">
      <div className="auth-container">
        <div className="auth-tabs">
          <button 
            className={`tab ${showLogin ? 'active' : ''}`}
            onClick={() => setShowLogin(true)}
          >
            Login
          </button>
          <button 
            className={`tab ${!showLogin ? 'active' : ''}`}
            onClick={() => setShowLogin(false)}
          >
            Register
          </button>
        </div>

        {showLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Login to PLPAK</h2>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter username"
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" className="submit-btn">Login</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <h2>Create Account</h2>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose username"
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Choose password"
              />
            </div>
            <div className="form-group">
              <label>Confirm Password:</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm password"
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" className="submit-btn">Register</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileManager;
