import React from 'react';

const GameControls = ({ gameStarted, roundOver }) => {
  return (
    <section className="buttons">
      <button className="deal">Deal</button>
      <button className="next">Next Round</button>
    </section>
  );
};

export default GameControls; 