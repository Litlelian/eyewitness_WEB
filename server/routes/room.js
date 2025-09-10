// server/routes/room.js
import express from "express";
const router = express.Router();

// 模擬房間資料
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
    players: room?.players || [],
    maxPlayers: room?.maxPlayers || 6,
    hostSlot: room?.hostSlot || null,
    gameLevel: room?.gameLevel || 8,
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
    rooms[id] = { players: [], maxPlayers: 6, gameLevel: 8, hostSlot: 0, gamePlaying: false};
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
      ...room,
    });
  }

  // 返回更新後的房間資料
  res.json(room);
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
      ...room,
    });
  }

  if (room.players.length === 0) {
    if (!room.gamePlaying) {
      console.log(`房間 ${id} 已空，刪除`);
      delete rooms[id];
      return res.json(room);
    }
  }
  res.json(room);
});

// API: 踢出玩家
router.post("/:id/kick", (req, res) => {
  const { id } = req.params;
  const { playerID } = req.body;

  const room = rooms[id];
  if (!room) return res.status(404).json({ error: "房間不存在" });

  const idx = room.players.findIndex((p) => p.id === playerID);
  if (idx === -1) return res.status(404).json({ error: "玩家不存在" });

  const removed = room.players.splice(idx, 1)[0];
  room.players.forEach((p, i) => (p.slot = i)); // 重排 slot

  console.log(`玩家 ${removed.name} 被房主踢出房間 ${id}`);
  req.broadcast(id, { type: "roomUpdate", ...room, removedPlayerID: playerID,});
  res.json(room);
});

// API: 轉交房主
router.post("/:id/transferHost", (req, res) => {
  const { id } = req.params;
  const { newHostID } = req.body;

  const room = rooms[id];
  if (!room) return res.status(404).json({ error: "房間不存在" });

  const newHost = room.players.find((p) => p.id === newHostID);
  if (!newHost) return res.status(404).json({ error: "目標玩家不存在" });

  room.hostSlot = newHost.slot;

  console.log(`房主轉交給 ${newHost.name} (${newHost.id})`);

  req.broadcast(id, { type: "roomUpdate", ...room });
  res.json(room);
});

// API: 修改最大玩家數
router.post("/:id/maxPlayers", (req, res) => {
  const { id } = req.params;
  const { maxPlayers } = req.body;

  const room = rooms[id];
  if (!room) return res.status(404).json({ error: "房間不存在" });

  if (maxPlayers < room.players.length) {
    return res.status(400).json({ error: `最大玩家數不能小於目前人數 (${room.players.length})` });
  }

  room.maxPlayers = maxPlayers;

  // 廣播給房間所有人
  req.broadcast(id, { type: "roomUpdate", ...room });

  res.json(room);
});

// API: 修改遊戲等級
router.post("/:id/level", (req, res) => {
  const { id } = req.params;
  const { level } = req.body;

  const room = rooms[id];
  if (!room) return res.status(404).json({ error: "房間不存在" });

  room.gameLevel = level;

  // 廣播給房間所有人
  req.broadcast(id, { type: "roomUpdate", ...room });

  res.json(room);
});

// API: 看遊戲是否已開始
router.get("/:id/getStartGame", (req, res) => {
  const { id } = req.params;
  const room = rooms[id];
  if (!room) {
    console.log(`房間 ${id} 並不存在`);
  }

  res.json({
    gamePlaying: room?.gamePlaying || false,
  });
})

// API: 開始遊戲
router.post("/:id/startGame", (req, res) => {
  const { id } = req.params;
  const { gameStart } = req.body;

  const room = rooms[id];
  if (!room) return res.status(404).json({ error: "房間不存在" });

  room.gamePlaying = gameStart;

  req.broadcast(id, { type: "gameStart", ...room });

  res.json(room);
});

// 將 router export
export default router;
