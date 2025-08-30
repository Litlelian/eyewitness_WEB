import express from "express";
import { Server } from "boardgame.io/dist/cjs/server.js";
import { MyGame } from "../src/game/MyGame.js"; 
import cors from "cors";

import roomsRouter from "./routes/room.js";

const apiApp = express();
apiApp.use(cors());
apiApp.use(express.json());

apiApp.use("/api/rooms", roomsRouter);

const API_PORT = 8001;
apiApp.listen(API_PORT, () => {
  console.log(`✅ Express API running at http://localhost:${API_PORT}`);
});

// --- boardgame.io Server ---
const gameServer = Server({
  games: [MyGame],
  origins: ["http://localhost:5173"],
});

const GAME_PORT = 8000;
gameServer.run(GAME_PORT, () => {
  console.log(`🎮 boardgame.io server running at http://localhost:${GAME_PORT}`);
});
