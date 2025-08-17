import React from 'react';

const GameBoard = () => {
  return (
    <>
      {/* Top hand (Player 3) */}
      <section className="tophand"></section>

      {/* Middle section with side hands and board */}
      <section className="play">
        <div className="hand-2"></div>

        <div className="board">
          <div className="player1"></div>
          <div className="player2"></div>
          <div className="player3"></div>
          <div className="player4"></div>
        </div>

        <div className="hand-4"></div>
      </section>

      {/* Bottom hand (Player 1/Human) */}
      <section className="human"></section>
    </>
  );
};

export default GameBoard; 