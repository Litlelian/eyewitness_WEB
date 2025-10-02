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

export function judge(players, locationResult, voteResult) {
  const countMap = {};
  let maxC = 0;

  // 如果律師有投票，他投的那個玩家票無效
  if (Object.values(players).some(player => player.role === "lawyer")) {
    let lawyerPID = null;
    for (const pid of Object.keys(players)) {
      if (players[pid].role === "lawyer") lawyerPID = pid;
    }
    const votedByLawyerPID = voteResult.vote[voteResult.pid.indexOf(lawyerPID)];
    if(votedByLawyerPID != "neutral" && votedByLawyerPID != "execute") {
      voteResult.vote.splice(voteResult.pid.indexOf(votedByLawyerPID), 1);
      voteResult.pid.splice(voteResult.pid.indexOf(votedByLawyerPID), 1);
    }
  }

  // 平票則同時淘汰
  for (const item of voteResult.vote) {
    if (item === "execute") continue;
    countMap[item] = (countMap[item] || 0) + 1;
    maxC = Math.max(maxC, countMap[item]);
  }
  const deadPlayerID = Object.keys(countMap).filter(key => countMap[key] === maxC);
  
  for (const deadpid of deadPlayerID) {
    if (deadpid != "execute") {
      if (locationResult[deadpid] === "killer") return 1;  // case 1: 殺手被抓，好人勝利
      if (locationResult[deadpid] === "bomber") return 2;  // case 2: 炸彈客被抓，炸彈客勝利
    }
  }
  return 3;  // case 3: 其餘職業被抓，壞人(炸彈客除外)勝利
}