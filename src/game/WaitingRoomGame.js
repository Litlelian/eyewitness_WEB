// WaitingRoomGame.js
export const WaitingRoomGame = {
  name: "WaitingRoom",
  
  setup: () => ({
    players: [],       // 玩家列表 [{id, name, slot}]
    hostSlot: 0,       // 房主位置
    maxPlayers: 6,
    gameLevel: 3,
  }),

  moves: {
    joinRoom(G, ctx, playerID, playerName) {
      if (!G.players.find(p => p.id === playerID)) {
        G.players.push({
          id: playerID,
          name: playerName,
          slot: G.players.length
        });
      }
    },

    leaveRoom(G, ctx, playerID) {
      G.players = G.players.filter(p => p.id !== playerID);
      // 重新分配 slot
      G.players.forEach((p, index) => p.slot = index);
    },

    setMaxPlayers(G, ctx, max) {
      G.maxPlayers = max;
    },

    setGameLevel(G, ctx, level) {
      G.gameLevel = level;
    }
  },

  // 只有觀察用，不影響遊戲
  endIf: (G, ctx) => null,
};
