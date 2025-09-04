import { v4 as uuidv4 } from "uuid";
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
  const [playerSlot, setPlayerSlot] = useState(null); // 當前玩家位置
  const [players, setPlayers] = useState([]); // 從 API 初始化
  const [hostSlot, setHostSlot] = useState(null); // 房主位置
  const [maxPlayers, setMaxPlayers] = useState(6); // 從 API 初始化
  const [level, setLevel] = useState(3); // 從 API 初始化
  const [error, setError] = useState(null); // 錯誤訊息
  const [isLoading, setIsLoading] = useState(true); // 標記 API 載入狀態
  const [isHost, setIsHost] = useState(false);

  const hasJoinedRef = useRef(false);
  const hasGenerateID = useRef(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!playerID) {
      if (hasGenerateID.current) return;
      hasGenerateID.current = true;
      const newID = uuidv4(); // 生成唯一 ID
      setPlayerID(newID);
    }
  }, [playerID]);

  // 初始化房間資訊並嘗試加入玩家
  useEffect(() => {
    if(!playerID) return;

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

        // 無論房間是否存在，直接嘗試加入玩家
        const postResponse = await fetch(`http://localhost:8001/api/rooms/${id}/addPlayers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: playerID,
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
        setHostSlot(postData.hostSlot || 0);

        const mySlotObj = postData.players.find(p => p.id === playerID);
        setPlayerSlot(mySlotObj?.slot ?? null);

        // === WebSocket 連線 ===
        const ws = new WebSocket("ws://localhost:8001");
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "joinRoom", roomID: id, playerID }));
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === "roomUpdate") {
            // 更新整個房間狀態
            setPlayers(data.players);
            setHostSlot(data.hostSlot ?? 0);

            // 更新自己在房間的位置
            const mySlotobj = data.players.find(p => p.id === playerID);
            setPlayerSlot(mySlotobj.slot);
          }
        };

        ws.onclose = () => {
          console.log("WebSocket 連線關閉");
        };
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

    // 離開房間時關閉 WebSocket
    return () => {
      wsRef.current?.close();
    };
  }, [id, playerID, playerName, navigate]);

  useEffect(() => {
    if (playerSlot === null || hostSlot === null) return;
    setIsHost(playerSlot === hostSlot);
  }, [playerSlot, hostSlot]);

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

  // 離開房間
  const handleLeaveRoom = async () => {
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

  // TODO 瀏覽器關閉或刷新時，自動離開房間

  if (isLoading) {
    return <div className="room-page">載入房間中...</div>;
  }

  return (
    <div className="room-page">
      <h1>🃏 房間 {id}</h1>
      <p>玩家名稱：{playerName}</p>
      {error && <p className="error">{error}</p>}

      {/* 顯示玩家格子 */}
      <PlayerGrid players={players} maxPlayers={maxPlayers} hostSlot={hostSlot} />

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