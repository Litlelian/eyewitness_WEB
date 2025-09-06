import React from "react";
import LEVEL_CONFIG from "../config/levelConfig.json";
import "./RoleGrid.css";

export default function RoleGrid({ level, maxPlayers }) {
  const levelConfig = LEVEL_CONFIG[level];
  if (!levelConfig) {
    return <div className="role-grid">未知的遊戲等級</div>;
  }

  // 找到符合 maxPlayers 的角色配置
  const roleDistribution = levelConfig.roles[maxPlayers];
  if (!roleDistribution) {
    return <div className="role-grid">此人數不支援該等級</div>;
  }

  return (
    <div className="role-grid">
      {Object.entries(roleDistribution).map(([role, count]) =>
        Array.from({ length: count }).map((_, idx) => (
          <div key={`${role}-${idx}`} className="role-card">
            <div className="role-label">{role}</div>
            <img
              src={`../assets/roles/${role}.png`}
              alt={role}
              className="role-image"
            />
          </div>
        ))
      )}
    </div>
  );
}
