import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import roomsRouter from "./routes/room.js";

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
  if (!rooms[roomID]) return;
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
      ws.roomID = roomID;
      ws.playerID = playerID;

      if (!rooms[roomID]) rooms[roomID] = new Set();
      rooms[roomID].add(ws);
    }
  });

  ws.on("close",async () => {
    const roomID = ws.roomID;
    const playerID = ws.playerID;

    try {
      // 呼叫你的 API
      const res = await fetch(`http://localhost:8001/api/rooms/${roomID}/leave`, {
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

const API_PORT = 8001;
server.listen(API_PORT, () => {
  console.log(`✅ Express + WS running at http://localhost:${API_PORT}`);
});
