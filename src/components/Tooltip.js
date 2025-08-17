import React from 'react';

const Tooltip = ({ visible, onToggle }) => {
  return (
    <div className="tooltip">
      <i className="info-icon" onClick={onToggle}>Rules</i>
      <ul>
        <span className="tooltiptext" style={{ display: visible ? 'block' : 'none' }}>
          <b>General Game Rules:</b>
          <li className="tooltip-item">The player to the left of the dealer starts</li>
          <li className="tooltip-item">The suit of the first card played in each round is the lead suit</li>
          <li className="tooltip-item">If you have a card of the lead suit you must play it</li>
          <li className="tooltip-item">The player with the highest card played of the lead suit takes each trick</li>
          <li className="tooltip-item">The player who takes the trick starts the next round</li>
          <li className="tooltip-item">The lowest score at the end of the game wins</li>
          <b>Round Specific Rules:</b>
          <li className="tooltip-item">Tricks Round: Each trick is worth 1 point</li>
          <li className="tooltip-item">Hearts Round: Each heart is worth 1 point</li>
          <li className="tooltip-item">Queens Round: Each queen is worth 2 points</li>
          <li className="tooltip-item">King of Hearts Round: No heart can be played in the 1st trick & the king of hearts is worth 8 points</li>
        </span>
      </ul>
    </div>
  );
};

export default Tooltip; 