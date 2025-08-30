import { useState } from "react";
import './Lobby.css';

export default function Lobby({ onCreateRoom, onJoinRoom }) {
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");

  return (
    <div className="lobby-container">
      <h1 className="text-2xl font-bold">目擊者之夜</h1>
      <h1 className="text-2xl font-bold">🎲 遊戲大廳</h1>

      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="輸入你的玩家名稱"
        className="lobby-input"
      />

      <input
        type="text"
        maxLength={4}
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="輸入 4 位數字 RoomID"
        className="lobby-input"
      />

      <div className="lobby-buttons">
        <button
          onClick={() => onCreateRoom(roomId, playerName)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          創建房間
        </button>

        <button
          onClick={() => onJoinRoom(roomId, playerName)}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          加入房間
        </button>
      </div>
    </div>
  );
}
