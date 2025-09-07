import React from "react";
import LEVEL_CONFIG from "../config/levelConfig.json";
import "./RoleGrid.css";

export default function RoleGrid({ level, maxPlayers }) {
  const levelConfig = LEVEL_CONFIG[level];
  const zhRole = {
    "killer": "殺人魔",
    "accomplice": "共犯",
    "bomber": "炸彈客",
    "lawyer": "律師",
    "businessman": "富商",
    "detective": "偵探",
    "butler": "管家",
    "guest": "訪客",
  }
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
