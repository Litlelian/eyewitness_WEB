// game.js
export const LOCATIONS = ["lounge", "gallery", "poolball", "study", "entrance", "restaurant"];
export const NEUTRAL_LOCATIONS = ["questroom"];
export const EXECUTE_LOCATIONS = ["boiler"];

export function assignLocations(players) {
  const shuffled = [...LOCATIONS].sort(() => Math.random() - 0.5);
  const mapping = {};
  players.forEach((p, i) => {
    mapping[p.id] = shuffled[i];
  });
  return mapping;
}