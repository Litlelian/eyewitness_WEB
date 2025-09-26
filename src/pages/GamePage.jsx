import SelectRole from "../components/SelectRole";
import ChatBox from "../components/ChatBox";

import React, { useMemo, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import CONFIG from "../config/config.json";
import "./GamePage.css";

export default function GamePage() {
  const location = useLocation();
  const { id, playerID, room } = location.state || {};
  const [currentTurn, setCurrentTurn] = useState(null);
  const [players, setPlayers] = useState(null);
  const [messages, setMessages] = useState([]);

  const hasJoinedRef = useRef(false);
  const wsRef = useRef(null);

  if (!room) {
    return <div>房間資料不存在，請從房間進入遊戲。</div>;
  }

  useEffect(() => {
    if(!playerID) return;
    const joinGame = async () => {
      if (hasJoinedRef.current) return;
      hasJoinedRef.current = true;
      // 取得房間資訊(地點分配、初始玩家等)
      const getResponse = await fetch(`${CONFIG["host"]}/api/game/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const getData = await getResponse.json();

      setPlayers(getData.players);
      setCurrentTurn(getData.currPlayerID);
      
      // 建立 WebSocket 連線
      const ws = new WebSocket("ws" + CONFIG["host"].slice(4));
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("GamePage WebSocket 已連線");
        // 告訴伺服器我進入了遊戲頁
        ws.send(JSON.stringify({ type: "startGame", roomID: id, playerID }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "nextTurn") {
          setCurrentTurn(data.currPlayerID); // 更新目前輪到誰
          console.log(`輪到 ${data.players[data.currPlayerID].name}`)
        }
      };

      ws.onclose = () => {
        console.log("GamePage WebSocket 已斷線");
      };
    };
    joinGame();
    return () => {
      wsRef.current?.close();
    };
  }, [room.id, playerID]);

  const handleNewMessage = (msg) => {
    setMessages((prev) => [...prev, { id: Date.now(), ...msg }]);
  };

  return (
    <div className="board-container">
      {/* 上方玩家區域 */}
      <div className="player-row">
        {room.players.map((p) => (
          <div
            key={p.id}
            className={`rect player-rect ${p.id === playerID ? "self-player" : ""} ${
              p.id === currentTurn ? "active-turn" : ""
            }`}
            style={{
              backgroundImage: players?.[p.id]?.location
              ? `url(/location/${players[p.id].location}.png)`
              : "none",
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
        <div className="rect" id="neutral"></div>
        <div className="rect" id="execute"></div>
      </div>

      <div className="player-UI">
        <div className={"ui-layout"}>
          {currentTurn === playerID && (
            <div className="select-role-wrapper">
              <SelectRole
                roomId={id}
                playerID={playerID}
                level={room.gameLevel}
                onMessage={handleNewMessage}
              />
            </div>
          )}
          <div className="chatbox-wrapper"
          style={{
              width: currentTurn === playerID ? "30%" : "100%", // 寬度切換
            }}
          >
            <ChatBox messages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
}
