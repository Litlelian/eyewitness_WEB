// server/routes/inGame.js
import express from "express";
import { assignLocations } from "../../src/game/game.js"
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

	return res.json(room);
});

// 將 router export
export default router;