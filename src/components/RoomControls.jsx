import React from "react";
import "./RoomControls.css";

const RoomControls = ({
  isHost,
  level,
  maxPlayerNum,
  players,
  onStartGame,
  onLeaveRoom,
  onChangeMaxPlayers,
  onChangeLevel,
}) => {
  return (
    <div className="room-controls">
      {isHost && (
        <>
          <div className="control-group">
            <label>遊戲等級 (1-8)：</label>
            <select
              value={level}
              onChange={(e) => onChangeLevel(Number(e.target.value))}
              className="control-select"
            >
              {[...Array(8)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  等級 {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label>最大玩家數 (3-6)：</label>
            <select
              value={maxPlayerNum}
              onChange={(e) => onChangeMaxPlayers(Number(e.target.value))}
              className="control-select"
            >
              {[3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} 人
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={onStartGame}
            disabled={players.length < 3}
            className="control-button start-button"
          >
            開始遊戲
          </button>
        </>
      )}
      <button onClick={onLeaveRoom} className="control-button leave-button">
        離開房間
      </button>
    </div>
  );
};

export default RoomControls;