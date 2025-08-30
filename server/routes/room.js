// server/routes/room.js
import express from "express";
const router = express.Router();

// 模擬房間資料
// 真實專案可以改成用資料庫或 Boardgame.io G
const rooms = {};

// API: 取得房間資訊
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const room = rooms[id];

  if (!room) {
    return res.json({ exists: false, players: [], maxPlayers: 6 });
  }

  res.json({
    exists: true,
    players: room.players || [],
    maxPlayers: room.maxPlayers || 6,
  });
});

// 將 router export
export default router;
