import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import PlayerGrid from "../components/PlayerGrid";
import RoomControls from "../components/RoomControls";
import "./RoomPage.css";

export default function RoomPage() {
  const { id } = useParams(); // 從 URL 獲取房間 ID
  const location = useLocation(); // 從 navigate 獲取 state
  const navigate = useNavigate();
  const playerName = location.state?.playerName?.trim() || "匿名玩家"; // 傳入的玩家名稱
  const [playerID, setPlayerID] = useState(null); // 當前玩家 ID
  const [players, setPlayers] = useState([]); // 從 API 初始化
  const [hostID, setHostID] = useState(null); // 房主 ID
  const [maxPlayers, setMaxPlayers] = useState(6); // 從 API 初始化
  const [level, setLevel] = useState(3); // 從 API 初始化
  const [error, setError] = useState(null); // 錯誤訊息
  const [isLoading, setIsLoading] = useState(true); // 標記 API 載入狀態

  const hasJoinedRef = useRef(false);

  // 初始化房間資訊並嘗試加入玩家
  useEffect(() => {
    const joinRoom = async () => {
      try {
        if (hasJoinedRef.current) return;
        hasJoinedRef.current = true;

        // 嘗試獲取房間資訊
        const getResponse = await fetch(`http://localhost:8001/api/rooms/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const getData = await getResponse.json();

        // 生成唯一 playerID（模擬，實際可使用 UUID
        const newPlayerID = getData.players.length;
        setPlayerID(newPlayerID);

        // 無論房間是否存在，直接嘗試加入玩家
        const postResponse = await fetch(`http://localhost:8001/api/rooms/${id}/addPlayers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: String(newPlayerID),
            name: playerName,
            slot: getData.exists ? getData.players.length : 0,
          }),
        });

        if (!postResponse.ok) {
          const errorData = await postResponse.json();
          setError(errorData.error || "加入房間失敗");
          alert(errorData.error || "加入房間失敗");
          navigate("/"); // 返回 Lobby
          return;
        }

        // 更新前端狀態
        const postData = await postResponse.json();
        setPlayers(postData.players || []);
        setMaxPlayers(postData.maxPlayers || 6);
        setLevel(postData.gameLevel || 3);
        setHostID(postData.players.length > 0 ? postData.players[0].slot : null);
      } catch (err) {
        console.error("加入房間失敗:", err);
        setError("無法加入房間，請稍後重試");
        alert("無法加入房間，請稍後重試");
        navigate("/"); // 返回 Lobby
      } finally {
        setIsLoading(false);
      }
    };
    joinRoom();
  }, [id, playerName, navigate]);

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
    alert("遊戲開始！（靜態模擬）");
  };

  // 離開房間（靜態模擬）
  const handleLeaveRoom = async () => {
    if (!playerID) return;
    try {
      await fetch(`http://localhost:8001/api/rooms/${id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerID }),
      });
    } catch (err) {
      console.error("離開房間失敗:", err);
    } finally {
      navigate("/");
    }
  };

  // 瀏覽器關閉或刷新時，自動離開房間
  useEffect(() => {
  const handleBeforeUnload = () => {
    if (!playerID) return;

    const url = `http://localhost:8001/api/rooms/${id}/leave`;
    const data = JSON.stringify({ playerID });

    navigator.sendBeacon(url, data);
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [id, playerID]);

  const isHost = playerID === hostID; // 檢查是否為房主

  if (isLoading) {
    return <div className="room-page">載入房間中...</div>;
  }

  return (
    <div className="room-page">
      <h1>🃏 房間 {id}</h1>
      <p>玩家名稱：{playerName}</p>
      {error && <p className="error">{error}</p>}

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