import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import PlayerGrid from "../components/PlayerGrid";
import RoomControls from "../components/RoomControls";
import "./RoomPage.css";

export default function RoomPage() {
  const { id } = useParams(); // 從 URL 獲取房間 ID
  const location = useLocation(); // 從 navigate 獲取 state
  const navigate = useNavigate();
  const playerName = location.state?.playerName?.trim() || "匿名玩家";
  const [playerID, setPlayerID] = useState(null); // 當前玩家 ID
  const [players, setPlayers] = useState([
    { id: "0", name: "玩家1", slot: 0 },
    { id: "1", name: "玩家2", slot: 1 },
    { id: "2", name: "玩家3", slot: 2 },
    { id: "3", name: "玩家4", slot: 3 },
    { id: "4", name: "玩家5", slot: 4 },
  ]); // 靜態模擬玩家數據
  const [hostID, setHostID] = useState("0"); // 靜態模擬房主
  const [maxPlayers, setMaxPlayers] = useState(6); // 預設最大玩家數
  const [level, setLevel] = useState(3); // 預設遊戲等級
  const [error, setError] = useState(null); // 錯誤訊息
  const [hasJoined, setHasJoined] = useState(false); // 標記是否已加入

  // 模擬玩家加入邏輯
  useEffect(() => {
    // 生成唯一 playerID（模擬，實際應從資料庫或伺服器生成）
    const newPlayerID = String(players.length);
    setPlayerID(newPlayerID);

    // 檢查房間是否已滿
    if (players.length >= maxPlayers) {
      if (hasJoined) return;
      setError("房間已滿，無法加入！");
      alert("房間已滿，無法加入！");
      navigate("/"); // 返回 Lobby
      return;
    }

    // 檢查是否已加入（避免重複）
    if (!players.some((p) => p.name === playerName)) {
      setPlayers((prevPlayers) => [
        ...prevPlayers,
        {
          id: newPlayerID,
          name: playerName,
          slot: prevPlayers.length,
        },
      ]);
      setHasJoined(true); // 標記已加入
    }
  }, [playerName, maxPlayers, navigate, players.length]);

  // 改變最大玩家數
  const handleChangeMaxPlayers = (num) => {
    if (num < players.length) {
      alert(`最大玩家數不能小於目前房間人數 (${players.length})`);
      return;
    }
    setMaxPlayers(num);
  };

  // 改變遊戲等級
  const handleChangeLevel = (newLevel) => {
    setLevel(newLevel);
  };

  // 開始遊戲（靜態模擬）
  const handleStartGame = () => {
    if (players.length < 3) {
      alert("至少需要 3 名玩家才能開始遊戲！");
      return;
    }
    if (players.length > maxPlayers) {
      alert(`目前玩家數 (${players.length}) 超過最大玩家數 (${maxPlayers})`);
      return;
    }
    console.log(players);
    alert("遊戲開始！（靜態模擬）");
  };

  // 離開房間（靜態模擬）
  const handleLeaveRoom = () => {
    navigate("/");
    alert("已離開房間！");
  };

  const isHost = true; // 靜態模擬房主（可根據需求調整）

  return (
    <div className="room-page">
      <h1>🃏 房間 {id}</h1>
      <p>玩家名稱：{playerName} 已加入</p>

      {/* 顯示玩家格子 */}
      <PlayerGrid players={players} maxPlayers={maxPlayers} hostID={hostID} />

      {/* 房主/玩家控制按鈕 */}
      <RoomControls
        isHost={isHost}
        level={level}
        maxPlayerNum={maxPlayers}
        players={players}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
        onChangeMaxPlayers={handleChangeMaxPlayers}
        onChangeLevel={handleChangeLevel}
      />
    </div>
  );
}