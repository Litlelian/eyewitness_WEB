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
    hostSlot: room?.hostSlot || null,
    gameLevel: room?.gameLevel || 3,
    gamePlaying: false,
  });
});

// API: 添加新玩家到房間
router.post("/:id/addPlayers", (req, res) => {
  const { id } = req.params;
  const { id: playerID, name, slot } = req.body;

  // 驗證請求資料
  if (!playerID || !name || slot === undefined) {
    return res.status(400).json({ error: "缺少必要的玩家資料（id, name, slot）" });
  }

  // 初始化房間（如果不存在）
  if (!rooms[id]) {
    console.log(`房間 ${id} 被創建`);
    rooms[id] = { players: [], maxPlayers: 6, gameLevel: 3, hostSlot: 0, gamePlaying: false};
  }

  const room = rooms[id];

  // 檢查房間是否已滿
  if (room.players.length >= room.maxPlayers) {
    return res.status(400).json({ error: "房間已滿，無法加入" });
  }

  // 檢查玩家是否已存在
  if (room.players.some((p) => p.name === name)) {
    return res.status(400).json({ error: `玩家 ${name} 已存在於房間中` });
  }

  // 檢查房間是否已開始遊戲
  if (room.gamePlaying) {
    return res.status(400).json({ error: "該房間已開始進行遊戲" });
  }

  // 添加新玩家
  const newPlayer = { id: playerID, name, slot };
  room.players.push(newPlayer);
  console.log(`玩家 ${name} 加入房間 ${id}, 第 ${slot} 格`);

  // 廣播給房間內所有 WebSocket
  if (req.broadcast) {
    req.broadcast(id, { 
      type: "roomUpdate",
      players: room.players,
      maxPlayers: room.maxPlayers,
      hostSlot: room.hostSlot,
      gameLevel: room.gameLevel,
      gamePlaying: room.gamePlaying,
    });
  }

  // 返回更新後的房間資料
  res.json({
    exists: true,
    players: room.players,
    maxPlayers: room.maxPlayers,
    hostSlot: room.hostSlot,
    gameLevel: room.gameLevel,
    gamePlaying: room.gamePlaying,
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

  // 更新slot
  room.players.forEach((p, index) => {
    p.slot = index;
  });

  // 如果被移除的是房主，遞補房主給第一位玩家
  if (removedPlayer.slot === room.hostSlot) {
    room.hostSlot = room.players.length > 0 ? 0 : null;
    console.log(`房主已離開，新的房主 slot = ${room.hostSlot}`);
  }

  // 廣播離開事件
  if (req.broadcast) {
    req.broadcast(id, {
      type: "roomUpdate",
      players: room.players,
      hostSlot: room.hostSlot,
      maxPlayers: room.maxPlayers,
      gameLevel: room.gameLevel,
      gamePlaying: room.gamePlaying
    });
  }

  if (room.players.length === 0) {
    console.log(`房間 ${id} 已空，刪除`);
    delete rooms[id];
    return res.json({
      exists: false,
      players: [],
      maxPlayers: 6,
      hostSlot: 0,
      gameLevel: 3,
      gamePlaying: false,
    });
  }

  res.json({
    exists: true,
    players: room.players,
    maxPlayers: room.maxPlayers,
    hostSlot: room.hostSlot,
    gameLevel: room.gameLevel,
    gamePlaying: room.gamePlaying || false,
  });
});

// 將 router export
export default router;
