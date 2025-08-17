import React, { useEffect, useState } from 'react';
import './App.css';
import Scoreboard from './components/Scoreboard';
import GameBoard from './components/GameBoard';
import GameControls from './components/GameControls';
import Tooltip from './components/Tooltip';
import Notifications from './components/Notifications';
import ProfileManager from './components/ProfileManager';
import ResetNameButton from './components/ResetNameButton';

function App() {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileTab, setProfileTab] = useState('login');

  const updateGameControllerWithUser = (user) => {
    // Update localStorage for the game controller
    if (user) {
      localStorage.setItem('plpakPlayerName', user.username);
    } else {
      localStorage.removeItem('plpakPlayerName');
    }
    
    // Force the controller to reload the player name
    if (window.winnerStyle) {
      window.winnerStyle.player1 = user ? user.username : 'Human';
    }
  };

  useEffect(() => {
    console.log("React App: DOM structure rendered");
    // Check if user is already logged in
    const savedUser = localStorage.getItem('plpakUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      // Update the game controller with the user's name
      updateGameControllerWithUser(user);
    }
  }, []);

  const toggleTooltip = (event) => {
    event.preventDefault();
    setTooltipVisible(!tooltipVisible);
  };

  const handleProfileAction = (action, user) => {
    if (action === 'login' || action === 'register') {
      setCurrentUser(user);
      setShowProfile(false);
      // Update the game controller with the user's name
      updateGameControllerWithUser(user);
    } else if (action === 'logout') {
      setCurrentUser(null);
      localStorage.removeItem('plpakUser');
      setShowProfile(false);
      // Reset the game controller name
      updateGameControllerWithUser(null);
    }
  };

  const toggleProfile = (tab = 'login') => {
    setProfileTab(tab);
    setShowProfile(!showProfile);
  };

  return (
    <div className="App">
      {/* Profile/Login/Register Buttons */}
      {currentUser ? (
        <>
          <div className="profile-button-container">
            <button onClick={() => toggleProfile('login')} className="profile-btn">
              Profile
            </button>
          </div>
          <div className="logout-button-container">
            <button onClick={() => handleProfileAction('logout')} className="logout-btn">
              Logout
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="profile-button-container">
            <button onClick={() => toggleProfile('login')} className="login-btn">
              Login
            </button>
            <button onClick={() => toggleProfile('register')} className="register-btn">
              Register
            </button>
          </div>
        </>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="profile-modal">
          <div className="profile-modal-content">
            <button onClick={toggleProfile} className="close-btn">×</button>
            <ProfileManager 
              onGameStart={handleProfileAction}
              onProfileSelect={setCurrentUser}
              initialTab={profileTab}
            />
          </div>
        </div>
      )}

      <h1 className="round">Loading...</h1>

      <Scoreboard 
        scores={{
          player1: { cycle1: 0, cycle2: 0, cycle3: 0, cycle4: 0, total: 0 },
          player2: { cycle1: 0, cycle2: 0, cycle3: 0, cycle4: 0, total: 0 },
          player3: { cycle1: 0, cycle2: 0, cycle3: 0, cycle4: 0, total: 0 },
          player4: { cycle1: 0, cycle2: 0, cycle3: 0, cycle4: 0, total: 0 }
        }}
        currentUser={currentUser}
      />

      <Notifications />

      <Tooltip 
        visible={tooltipVisible} 
        onToggle={toggleTooltip} 
      />

      <GameBoard />

      <GameControls 
        gameStarted={false}
        roundOver={false}
      />

      {/* Conditionally render Reset Name button for logged out users */}
      {!currentUser && <ResetNameButton />}
    </div>
  );
}

export default App;
