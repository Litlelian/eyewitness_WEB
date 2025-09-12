import React from "react";
import LEVEL_CONFIG from "../config/levelConfig.json";
import ZHROLE_CONFIG from "../config/zhrole.json";
import "./RoleGrid.css";

export default function RoleGrid({ level, maxPlayers }) {
  const levelConfig = LEVEL_CONFIG[level];
  const zhRole = ZHROLE_CONFIG
  if (!levelConfig) {
    return <div className="role-grid">未知的遊戲等級</div>;
  }

  // 找到符合 maxPlayers 的角色配置
  const roleDistribution = levelConfig.distribution[maxPlayers];
  if (!roleDistribution) {
    return <div className="role-grid">此人數不支援該等級</div>;
  }
  const specialRules = levelConfig.special;

  return (
    <>
      <div className="role-grid">
        {Object.entries(roleDistribution).map(([role, count]) =>
          Array.from({ length: count }).map((_, idx) => (
            <div key={`${role}-${idx}`} className="role-card">
              <div className="role-label">{zhRole[role]}</div>
              <img
                src={`/roles/${role}.png`}
                alt={role}
                className="role-image"
              />
            </div>
          ))
        )}
      </div>
      <div className="special-rules">{specialRules}</div>
    </>
  );
}
