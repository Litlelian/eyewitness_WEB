import React, { useMemo }  from "react";
import { useLocation } from "react-router-dom";
import { assignLocations } from "../game/game";
import "./GamePage.css";

export default function GamePage() {
  const location = useLocation();
  const { playerID, room } = location.state || {};

  if (!room) {
    return <div>房間資料不存在，請從房間進入遊戲。</div>;
  }

  // 分配地點，只在 room.players 改變時計算
  const playerLocations = useMemo(() => assignLocations(room.players), [room.players]);

  return (
    <div className="board-container">
      {/* 上方玩家區域 */}
      <div className="player-row">
        {room.players.map((p) => (
          <div
            key={p.id}
            className={`rect player-rect ${p.id === playerID ? "self-player" : ""}`}
            style={{
              backgroundImage: `url(/location/${playerLocations[p.id]}.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <span className="player-name">{p.name}</span>
          </div>
        ))}
      </div>

      {/* 下方兩個額外長方形 */}
      <div className="extra-row">
        <div className="rect extra-rect">額外 1</div>
        <div className="rect extra-rect">額外 2</div>
      </div>

      {/* 分配結果 */}
      <div className="assignment-result">
        <h3>玩家地點分配結果</h3>
        <ul>
          {room.players.map((p) => (
            <li key={p.id}>
              {p.name}: {playerLocations[p.id]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
