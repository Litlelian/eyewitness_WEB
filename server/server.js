import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import roomsRouter from "./routes/room.js";
import inGameRouter from "./routes/inGame.js";

import fs from "fs";
import path from "path";

const configPath = path.resolve("../src/config/config.json");
const CONFIG = JSON.parse(fs.readFileSync(configPath, "utf8"));

const apiApp = express();
apiApp.use(cors());
apiApp.use(express.json());

// 建立 HTTP server，讓 WebSocket 和 Express 共用
const server = createServer(apiApp);

// 建立 WebSocketServer
const wss = new WebSocketServer({ server });

// roomID -> Set of WebSocket clients
const rooms = {};

// 廣播函式
export function broadcast(roomID, message) {
  if (!rooms[roomID]) {
    console.log(`Web Socket 找不到房間 ${roomID}`);
    return;
  };
  const data = JSON.stringify(message);
  for (const client of rooms[roomID]) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}

// WebSocket 連線處理
wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    if (data.type === "joinRoom") {
      const { roomID, playerID } = data;
      // 之後會寫遊戲結束返回房間的方法
      ws.roomID = roomID;
      ws.playerID = playerID;
      ws.gameState = "room";

      if (!rooms[roomID]) rooms[roomID] = new Set();
      rooms[roomID].add(ws);
    }
    if (data.type === "startGame") {
      const { roomID, playerID } = data;
      broadcast(roomID, { type: "gameStart", roomID });
      console.log(`🎮 Room ${roomID} : ${playerID} 進入遊戲`);
      // 刪除 RoomPage 留下的 Socket
      if (rooms[roomID]) {
        for (const clientWs of rooms[roomID]) {
          if (clientWs.gameState === "room") {
            rooms[roomID].delete(clientWs);
          }
        }
      }
      ws.roomID = roomID;
      ws.playerID = playerID;
      ws.gameState = "game";
      rooms[roomID].add(ws);
    }
  });

  ws.on("close",async () => {
    const roomID = ws.roomID;
    const playerID = ws.playerID;

    try {
      const ifGameStart = await fetch(`${CONFIG["host"]}/api/rooms/${roomID}/getStartGame`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const checkGameStart = await ifGameStart.json();
      if(checkGameStart.gamePlaying) return;
      const res = await fetch(`${CONFIG["host"]}/api/rooms/${roomID}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerID }),
      });

      if (!res.ok) {
        console.error(`WebSocket 斷線時呼叫 leave API 失敗: ${res.status}`);
        return;
      }

      const updatedRoom = await res.json();

      // 廣播房間更新給剩餘玩家
      broadcast(roomID, { type: "roomUpdate", ...updatedRoom });

    } catch (err) {
      console.error("WebSocket 斷線處理離開房間失敗:", err);
    }

    if (roomID && rooms[roomID]) {
      rooms[roomID].delete(ws);
    }
  });
});

// 將 broadcast 函式傳給 router
apiApp.use((req, res, next) => {
  req.broadcast = broadcast;
  next();
});

apiApp.use("/api/rooms", roomsRouter);
apiApp.use("/api/game", inGameRouter);

const API_PORT = CONFIG["port"];
server.listen(API_PORT, () => {
  console.log(`✅ Express + WS running at http://localhost:${API_PORT}`);
});
