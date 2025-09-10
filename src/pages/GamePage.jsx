import React from "react";
import "./GamePage.css";

export default function PlayerBoard({ playerID, roomData }) {
  // 建立一個陣列 [0, 1, 2, ... N-1]
  const players = Array.from({ length: length(roomData.players) }, (_, i) => i);

  return (
    <div className="board-container">
      {/* 上方玩家區域 */}
      <div className="player-row">
        {players.map((p) => (
          <div key={p} className="rect player-rect">
            玩家 {p + 1}
          </div>
        ))}
      </div>

      {/* 下方兩個額外的長方形 */}
      <div className="extra-row">
        <div className="rect extra-rect">額外 1</div>
        <div className="rect extra-rect">額外 2</div>
      </div>
    </div>
  );
}
