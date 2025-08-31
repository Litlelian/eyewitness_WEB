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
  console.log("GET room", id)

  if (!room) {
    console.log(`房間 ${id} 並不存在`);
  }

  res.json({
    exists: !!room,
    players: room?.players || [],
    maxPlayers: room?.maxPlayers || 6,
    gameLevel: room?.gameLevel || 3,
    gamePlaying: false,
  });
});

// API: 添加新玩家到房間
router.post("/:id/addPlayers", (req, res) => {
  const { id } = req.params;
  console.log("Leave Room", id)
  const { id: playerID, name, slot } = req.body;

  // 驗證請求資料
  if (!playerID || !name || slot === undefined) {
    return res.status(400).json({ error: "缺少必要的玩家資料（id, name, slot）" });
  }

  // 初始化房間（如果不存在）
  if (!rooms[id]) {
    console.log(`房間 ${id} 被創建`);
    rooms[id] = { players: [], maxPlayers: 6, gameLevel: 3, gamePlaying: false};
  }

  // 檢查房間是否已滿
  if (rooms[id].players.length >= rooms[id].maxPlayers) {
    return res.status(400).json({ error: "房間已滿，無法加入" });
  }

  // 檢查玩家是否已存在
  if (rooms[id].players.some((p) => p.name === name)) {
    return res.status(400).json({ error: `玩家 ${name} 已存在於房間中` });
  }

  // 檢查房間是否已開始遊戲
  if (rooms[id].gamePlaying) {
    return res.status(400).json({ error: "該房間已開始進行遊戲" });
  }

  // 添加新玩家
  rooms[id].players.push({ id: playerID, name, slot });
  console.log(`玩家 ${name} 加入房間 ${id}`);

  // 返回更新後的房間資料
  res.json({
    exists: true,
    players: rooms[id].players,
    maxPlayers: rooms[id].maxPlayers,
    gameLevel: rooms[id].gameLevel,
    gamePlaying: rooms[id].gamePlaying,
  });
});

// API: 玩家離開房間 (POST 統一用)
router.post("/:id/leave", (req, res) => {
  const { id } = req.params;
  const { playerID } = req.body;

  const room = rooms[id];
  if (!room) {
    return res.status(404).json({ error: `房間 ${id} 不存在` });
  }
  const playerIndex = room.players.findIndex((p) => p.id === playerID);
  if (playerIndex === -1) {
    return res.status(404).json({ error: `玩家 ${playerID} 不存在於房間 ${id}` });
  }

  const removedPlayer = room.players.splice(playerIndex, 1)[0];
  console.log(`玩家 ${removedPlayer.name} (${removedPlayer.id}) 離開房間 ${id}`);

  room.players.forEach((p, index) => {
    p.slot = index;
  });

  if (room.players.length === 0) {
    console.log(`房間 ${id} 已空，刪除`);
    delete rooms[id];
    return res.json({
      exists: false,
      players: [],
      maxPlayers: 6,
      gameLevel: 3,
      gamePlaying: false,
    });
  }

  res.json({
    exists: true,
    players: room.players,
    maxPlayers: room.maxPlayers,
    gameLevel: room.gameLevel,
    gamePlaying: room.gamePlaying || false,
  });
});

// 將 router export
export default router;
