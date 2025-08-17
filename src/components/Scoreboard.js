import React from 'react';

const Scoreboard = ({ scores, currentUser }) => {
  return (
    <section className="scoreboard">
      <div className="score-header">
        <div className="score-name">Player</div>
        <div className="cycle-header">Rnd 1</div>
        <div className="cycle-header">Rnd 2</div>
        <div className="cycle-header">Rnd 3</div>
        <div className="cycle-header">Rnd 4</div>
        <div className="cycle-header total">Total</div>
      </div>
      <div className="score-row">
        <div className="score-name">{currentUser?.username || 'Human'}</div>
        <div className="score cycle-1">{scores?.player1?.cycle1 || 0}</div>
        <div className="score cycle-2">{scores?.player1?.cycle2 || 0}</div>
        <div className="score cycle-3">{scores?.player1?.cycle3 || 0}</div>
        <div className="score cycle-4">{scores?.player1?.cycle4 || 0}</div>
        <div className="score total">{scores?.player1?.total || 0}</div>
      </div>
      <div className="score-row">
        <div className="score-name">Player 2</div>
        <div className="score cycle-1">{scores?.player2?.cycle1 || 0}</div>
        <div className="score cycle-2">{scores?.player2?.cycle2 || 0}</div>
        <div className="score cycle-3">{scores?.player2?.cycle3 || 0}</div>
        <div className="score cycle-4">{scores?.player2?.cycle4 || 0}</div>
        <div className="score total">{scores?.player2?.total || 0}</div>
      </div>
      <div className="score-row">
        <div className="score-name">Player 3</div>
        <div className="score cycle-1">{scores?.player3?.cycle1 || 0}</div>
        <div className="score cycle-2">{scores?.player3?.cycle2 || 0}</div>
        <div className="score cycle-3">{scores?.player3?.cycle3 || 0}</div>
        <div className="score cycle-4">{scores?.player3?.cycle4 || 0}</div>
        <div className="score total">{scores?.player3?.total || 0}</div>
      </div>
      <div className="score-row">
        <div className="score-name">Player 4</div>
        <div className="score cycle-1">{scores?.player4?.cycle1 || 0}</div>
        <div className="score cycle-2">{scores?.player4?.cycle2 || 0}</div>
        <div className="score cycle-3">{scores?.player4?.cycle3 || 0}</div>
        <div className="score cycle-4">{scores?.player4?.cycle4 || 0}</div>
        <div className="score total">{scores?.player4?.total || 0}</div>
      </div>
    </section>
  );
};

export default Scoreboard; 