// game.js
export const LOCATIONS = ["lounge", "gallery", "poolball", "study", "entrance", "restaurant"];
export const NEUTRAL_LOCATIONS = ["guestroom"];
export const EXECUTE_LOCATIONS = ["boiler"];
import LEVEL_CONFIG from "../config/levelConfig.json" with { type: "json" };

export function assignLocations(players) {
  const shuffled = [...LOCATIONS].sort(() => Math.random() - 0.5);
  const mapping = {};
  players.forEach((p, i) => {
    mapping[p.id] = shuffled[i];
  });
  return mapping;
}

export function shuffle(level, maxPlayer) {
  const roleConfig = LEVEL_CONFIG[level].distribution[maxPlayer];

  // 洗牌
  const order = [];
  for (const [role, count] of Object.entries(roleConfig)){
    if (role == "killer") {continue;}
    for (let i = 0; i < count; i++) {
      order.push(role);
    }
  }

  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]]; // swap
  }

  // 特殊規則
  let keep = null;
  if (level == 7 || level == 8){
    console.log(LEVEL_CONFIG[level].special);
    keep = order.splice(0, 2);
    if (level == 8) {
      order.splice(0, 2);
    }
  }

  order.push("killer");

  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]]; // swap
  }
  return { keep: keep, order: order };
}