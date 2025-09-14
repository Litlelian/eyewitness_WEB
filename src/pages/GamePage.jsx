import React, { useMemo, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import CONFIG from "../config/config.json";
import ZHLOCATION_CONFIG from "../config/zhlocation.json";
import { assignLocations } from "../game/game";
import "./GamePage.css";

export default function GamePage() {
  const location = useLocation();
  const { id, playerID, room } = location.state || {};
  const [currentTurn, setCurrentTurn] = useState(null);
  const [players, setPlayers] = useState(null);

  const hasJoinedRef = useRef(false);
  const wsRef = useRef(null);

  if (!room) {
    return <div>房間資料不存在，請從房間進入遊戲。</div>;
  }

  useEffect(() => {
    console.log(players);
    console.log(currentTurn);
  }, [players, currentTurn]);

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
        ws.send(JSON.stringify({ type: "joinGame", roomID: room.id, playerID }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "turnStart") {
          setCurrentTurn(data.playerID); // 更新目前輪到誰
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

      {/* 提示 */}
      <div>
        {currentTurn === playerID && (
          <h2>輪到你了</h2>
        )}
      </div>
    </div>
  );
}
