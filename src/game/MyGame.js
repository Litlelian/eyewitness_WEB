// src/game/MyGame.js
export const MyGame = {
  name: "mygame",

  setup: () => ({
    players: [], // 初始玩家陣列
  }),

  moves: {
    addPlayer(G, ctx, playerName) {
      console.log("addPlayer！", playerName);

      // 避免重複加入
      if (!G.players.some(p => p.name === playerName)) {
        G.players.push({
          name: playerName,
          id: ctx.playerID,
          slot: G.players.length,
        });
      }

      return G;
    },
  },
};
