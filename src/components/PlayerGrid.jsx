import React from "react";
import "./PlayerGrid.css";

const PlayerGrid = ({ players, maxPlayers, hostSlot }) => {
  // 創建格子，填充玩家或空位
  const grid = Array.from({ length: maxPlayers }, (_, index) => {
    const player = players[index];
    return (
      <div
        key={index}
        className={`player-grid-item ${player ? "occupied" : "empty"}`}
      >
        {player ? (
          <>
            {player.slot === hostSlot && <span className="host-label">房主</span>}
            <span className="player-name">{player.name}</span>
          </>
        ) : (
          <span className="empty-slot">空位</span>
        )}
      </div>
    );
  });

  return <div className="player-grid">{grid}</div>;
};

export default PlayerGrid;