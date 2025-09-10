import React from "react";
import { useLocation } from "react-router-dom";
import "./GamePage.css";

export default function GamePage() {
  const location = useLocation();
  const { playerID, room } = location.state || {};

  if (!room) {
    return <div>房間資料不存在，請從房間進入遊戲。</div>;
  }

  return (
    <div className="board-container">
      {/* 上方玩家區域 */}
      <div className="player-row">
        {room.players.map((p) => (
          <div
            key={p.id}
            className={`rect player-rect ${p.id === playerID ? "self-player" : ""}`}
          >
            {p.name}
          </div>
        ))}
      </div>

      {/* 下方兩個額外長方形 */}
      <div className="extra-row">
        <div className="rect extra-rect">額外 1</div>
        <div className="rect extra-rect">額外 2</div>
      </div>
    </div>
  );
}
