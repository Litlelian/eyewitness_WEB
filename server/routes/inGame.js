// server/routes/inGame.js
import express from "express";
import { assignLocations, shuffle } from "../../src/game/game.js"
const router = express.Router();

const rooms = {};

// API : 取得房間資訊
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const room = rooms[id];

  if (!room) {
    return res.status(404).json({ error: "找不到房間" });
  }

  return res.json(room);
});

// API : 創建該遊戲房間的資料
router.post("/:id/createRoom", (req, res) => {
  const { id } = req.params;
  const { players } = req.body;

  if (!id || !Array.isArray(players)) {
    return res.status(400).json({ error: "缺少 id 或 players 陣列" });
  }

	if (rooms[id]) {
    return res.status(400).json({ error: "房間已存在" });
  }

	console.log(`建立遊戲房間 ${id}`);

	// 初始化房間資料結構
  rooms[id] = {"players": {}, "currPlayerID": null};
  players.forEach((p) => {
		rooms[id]["players"][p.id] = {
			name: p.name,
			location: null,
			role: null,
		};
	});
	
	const room = rooms[id];
	// 決定第一個玩家
	let keys = Object.keys(room.players);
	const firstPlayerID = keys[Math.floor(Math.random() * keys.length)];
	room.currPlayerID = firstPlayerID;
	console.log(`玩家 ${room.players[firstPlayerID].name} id : ${firstPlayerID} 先開始`);

	// 隨機分配地點給玩家
	const mapping = assignLocations(players);
	Object.keys(mapping).forEach((pid) => {
		room.players[pid].location = mapping[pid];
	});

  // 刪除第一位玩家的location
  room.availableLocations = Object.values(mapping).filter((location) => location != room.players[firstPlayerID].location)

	return res.json(room);
});

router.post("/:id/shuffle", (req, res) => {
  const { id } = req.params;
  const { level, maxPlayers } = req.body;

  if (!id || !level || !maxPlayers) {
    return res.status(400).json({ error: "缺少 room id、level 或 maxPlayer 參數" });
  }

  const shuffled = shuffle(level, maxPlayers);
  rooms[id]["order"] = shuffled;

  return res.json(shuffled);
});

router.post("/:id/selectRole", (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!id || !role) {
    return res.status(400).json({ error: "缺少 room id 或 role 參數" });
  }

  const room = rooms[id];
  const currPlayerID = room.currPlayerID;

  room["players"][currPlayerID].role = role;

  // 從order刪除被選走的角色
  for (let i = 0; i < 2; i++) {
    if (room.order.order[i] === role) {
      room.order.order.splice(i, 1);
      break;
    }
  }

  return res.json(room);
});

router.post("/:id/nextPlayer", (req, res) => {
  const { id } = req.params;
  const { saidRole, nextLocation } = req.body;

  if (!id || !saidRole || !nextLocation) {
    return res.status(400).json({ error: "缺少 room id 、saidRole 或 nextLocation 參數" });
  }

  const room = rooms[id];

  if (nextLocation === "guestroom") {
    room.locationResult = {};
    Object.keys(room.players).forEach((pid) => {
      room.locationResult[room.players[pid].location] = room.players[pid].role;
    });
    room.locationResult["guestroom"] = room.order.order[0];
  }

  req.broadcast(id, { type: "chatMessage", playerName: `${room.players[room.currPlayerID].name}`, saidRole: saidRole, nextLocation: nextLocation});

  // 刪除此次目標的 location
  room.availableLocations = Object.values(room.availableLocations).filter((location) => location != nextLocation)

  Object.keys(room.players).forEach((pid) => {
    if (room.players[pid].location === nextLocation) {
      room.currPlayerID = pid;
    }
  });

  if (nextLocation === "guestroom") {
    console.log(`Room ${id} 遊戲階段一結束，進入投票環節`);
    room.currPlayerID = -1;
    req.broadcast(id, { type: "voting", ...room.locationResult });
  }
  else {
    req.broadcast(id, { type: "nextTurn", ...room });
  } 

  return res.json(room);
});

// 將 router export
export default router;