import React, { useEffect, useState } from "react";
import CONFIG from "../config/config.json";
import ROLE_CONFIG from "../config/role_intro.json";
import ZHROLE_CONFIG from "../config/zhrole.json";
import LEVEL_CONFIG from "../config/levelConfig.json";
import ZHLOCATION_CONFIG from "../config/zhlocation.json";
import "./SelectRole.css";

export default function SelectRole({ roomId, playerID, level }) {
  const [order, setOrder] = useState([]);
  const [firstTwo, setFirstTwo] = useState([]);
  const [isLastPlayer, setIsLastPlayer ] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRoleID, setSelectedRoleID] = useState(-1);
  const [selectedSayRole, setSelectedSayRole] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [availableLocations, setAvailableLocations] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`${CONFIG["host"]}/api/game/${roomId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch room");
        const data = await res.json();
        setOrder(data.order.order || []);
        setFirstTwo(data.order.order.slice(0, 2));
        setIsLastPlayer(data.order.order.filter((r) => r == null).length === 1);
        setAvailableLocations(data.availableLocations)
      } catch (err) {
        console.error("Error fetching room:", err);
      }
    };

    if (roomId) fetchRoom();
  }, [roomId]);

  return (
    <div className="select-role-container">
      <div className="role-cards">
        {firstTwo.map((role, idx) => (
          <div
            key={`role-${idx}`}
            className={`role-card ${selectedRoleID === idx ? "selected" : ""}`}
            onClick={() => {
              setSelectedRole(role);
              setSelectedRoleID(idx);
            }}
          >
            <img src={`/roles/${role}.png`} alt={role} />
          </div>
        ))}
      </div>

      {/* 根據選擇顯示角色介紹 */}
      {selectedRole && (
        <>
          <div className="role-name">
            {ZHROLE_CONFIG[selectedRole]}
          </div>
          <div className="role-intro">
            <p>{ROLE_CONFIG[selectedRole]}</p>
          </div>

          {/* 選項區域 */}
          <div className="select-options">
            {/* 選職業 */}
            <div className="custom-select">
              <div className="select-label">某職業：</div>
              <div className="select-trigger">
                {selectedSayRole ? ZHROLE_CONFIG[selectedSayRole] : "請選擇職業"}
              </div>
              <ul className="options">
                {LEVEL_CONFIG[level].roles.map((role) => (
                  <li
                    key={role}
                    onClick={() => setSelectedSayRole(role)}
                    className={selectedSayRole === role ? "active" : ""}
                  >
                    {ZHROLE_CONFIG[role]}
                  </li>
                ))}
              </ul>
            </div>

            {/* 選地點 */}
            <div className="custom-select">
              <div className="select-label">某地點：</div>
              <div className="select-trigger">
                {selectedLocation ? ZHLOCATION_CONFIG[selectedLocation] : "請選擇地點"}
              </div>
              <ul className="options">
                {isLastPlayer ? (
                  <li
                    key="客房"
                    onClick={() => setSelectedLocation("客房")}
                    className={selectedLocation === "客房" ? "active" : ""}
                  >
                    客房
                  </li>
                ) : (
                  availableLocations?.map((loc) => (
                    <li
                      key={loc}
                      onClick={() => setSelectedLocation(loc)}
                      className={selectedLocation === loc ? "active" : ""}
                    >
                      {ZHLOCATION_CONFIG[loc]}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* 確認按鈕 */}
            <button
              className="confirm-btn"
              disabled={!selectedRole || !selectedSayRole || !selectedLocation}
              onClick={() => {
                console.log("確定選擇：", {
                  selectedRole,
                  selectedSayRole,
                  selectedLocation,
                });
                // TODO: 呼叫 API，把選擇送到後端
              }}
            >
              確定選擇
            </button>
          </div>
        </>
      )}
      
    </div>
  );
}