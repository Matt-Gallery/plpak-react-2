import React from 'react';

const ResetNameButton = ({ onResetName }) => {
  const handleResetName = () => {
    console.log("Resetting player name...");
    localStorage.removeItem('plpakPlayerName');
    // Trigger the name prompt from the controller
    if (window.promptForPlayerName) {
      window.promptForPlayerName();
    }
    if (onResetName) {
      onResetName();
    }
  };

  return (
    <button
      className="reset-name-btn"
      onClick={handleResetName}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: '9999',
        backgroundColor: '#3498db',
        color: 'white',
        border: '2px solid black',
        borderRadius: '4px',
        padding: '5px 10px',
        cursor: 'pointer'
      }}
      title="Change your player name"
    >
      👤 Reset Name
    </button>
  );
};

export default ResetNameButton; 