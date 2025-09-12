import { v4 as uuidv4 } from "uuid";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import CONFIG from "../config/config.json";
import PlayerGrid from "../components/PlayerGrid";
import RoomControls from "../components/RoomControls";
import RoleGrid from "../components/RoleGrid";
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
  const [maxPlayers, setMaxPlayers] = useState(3); // 從 API 初始化
  const [level, setLevel] = useState(1); // 從 API 初始化
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
        const getResponse = await fetch(`${CONFIG["host"]}/api/rooms/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const getData = await getResponse.json();

        // 無論房間是否存在，直接嘗試加入玩家
        const postResponse = await fetch(`${CONFIG["host"]}/api/rooms/${id}/addPlayers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: playerID,
            name: playerName,
            slot: getData.players.length,
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
        setMaxPlayers(postData.maxPlayers || 3);
        setLevel(postData.gameLevel || 1);
        setHostSlot(postData.hostSlot || 0);

        const mySlotObj = postData.players.find(p => p.id === playerID);
        setPlayerSlot(mySlotObj?.slot ?? null);

        // === WebSocket 連線 ===
        const ws = new WebSocket("ws" + CONFIG["host"].slice(4));
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "joinRoom", roomID: id, playerID }));
        };

        ws.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          console.log(data.type);

          if (data.type === "roomUpdate") {
            if (data.removedPlayerID === playerID){
              alert("你已被房主踢出房間");
              navigate("/");
            }
            else{
              // 更新整個房間狀態
              setPlayers(data.players);
              setHostSlot(data.hostSlot ?? 0);
              setLevel(data.gameLevel);
              setMaxPlayers(data.maxPlayers);

              // 更新自己在房間的位置
              const mySlotobj = data.players.find(p => p.id === playerID);
              setPlayerSlot(mySlotobj.slot);
            }
          }
          if (data.type === "gameStart") {
            navigate(`/room/${id}/game`, { state: {id, playerID, room: data} });
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

  // host提出或轉移host給其他玩家
  const handlePlayerAction = async (targetPlayer) => {
    const action = window.prompt(
      `要對玩家 ${targetPlayer.name} 做什麼？\n輸入 "kick" 踢出，或 "host" 轉交房主`
    );

    if (action === "kick") {
      await fetch(`${CONFIG["host"]}/api/rooms/${id}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerID: targetPlayer.id }),
      });
    }

    if (action === "host") {
      await fetch(`${CONFIG["host"]}/api/rooms/${id}/transferHost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newHostID: targetPlayer.id }),
      });
    }
  };

  // 改變最大玩家數
  const handleChangeMaxPlayers = async (num) => {
    if (num < players.length) {
      alert(`最大玩家數不能小於目前房間人數 (${players.length})`);
      return;
    }
    setMaxPlayers(num);
    await fetch(`${CONFIG["host"]}/api/rooms/${id}/maxPlayers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxPlayers: num }),
    });
  };

  // 改變遊戲等級
  const handleChangeLevel = async (newLevel) => {
    setLevel(newLevel);
    await fetch(`${CONFIG["host"]}/api/rooms/${id}/level`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: newLevel }),
    });
  };
  
  // 開始遊戲
  const handleStartGame = async() => {
    if (players.length < 3) {
      alert(`至少需要 3 名玩家才能開始遊戲！`);
      return;
    }
    if (players.length > maxPlayers) {
      alert(`目前玩家數 (${players.length}) 超過最大玩家數 (${maxPlayers})`);
      return;
    }
    if (players.length != maxPlayers) {
      alert(`目前玩家數 (${players.length}) 未達最大玩家數 (${maxPlayers})，請房主調整相關設定`);
      return;
    }
    await fetch(`${CONFIG["host"]}/api/game/${id}/createRoom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players: players }),
    });
    await fetch(`${CONFIG["host"]}/api/rooms/${id}/startGame`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameStart: true }),
    });
  };

  // 離開房間
  const handleLeaveRoom = async () => {
    try {
      await fetch(`${CONFIG["host"]}/api/rooms/${id}/leave`, {
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

  if (isLoading) {
    return <div className="room-page">載入房間中...</div>;
  }

  return (
    <div className="room-page">
      <h1>房間 {id}</h1>
      <p>玩家名稱：{playerName}</p>
      {error && <p className="error">{error}</p>}

      {/* 顯示玩家格子 */}
      <PlayerGrid 
        players={players}
        maxPlayers={maxPlayers}
        hostSlot={hostSlot} 
        isHost={isHost}
        onPlayerAction={handlePlayerAction}
      />

      {/* 顯示角色格子 */}
      <RoleGrid level={level} maxPlayers={maxPlayers} />

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