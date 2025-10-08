import SelectRole from "../components/SelectRole";
import ChatBox from "../components/ChatBox";
import StepTimer from "../components/Timer";
import CONFIG from "../config/config.json";
import ROLE_CONFIG from "../config/role_intro.json";
import ZHROLE_CONFIG from "../config/zhrole.json";
import ZHLOCATION_CONFIG from "../config/zhlocation.json";

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GamePage.css";

export default function GamePage() {
  const location = useLocation();
  const { id, playerID, room } = location.state || {};
  const [currentTurn, setCurrentTurn] = useState(null);
  const [confirmedRole, setConfirmedRole] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [players, setPlayers] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notify, setNotify] = useState(null);
  const [hasVote, setHasVote] = useState(false);
  
  const navigate = useNavigate();

  const confirmedRoleRef = useRef(null);
  const hasJoinedRef = useRef(false);
  const wsRef = useRef(null);

  if (!room) {
    return <div>房間資料不存在，請從房間進入遊戲。</div>;
  }

  useEffect(() => {
    if(!playerID) return;
    const joinGame = async () => {
      if (hasJoinedRef.current) return;
      hasJoinedRef.current = true;
      // 取得房間資訊(地點分配、初始玩家等)
      const getResponse = await fetch(`/api/game/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const getData = await getResponse.json();

      setPlayers(getData.players);
      setCurrentTurn(getData.currPlayerID);
      
      // 建立 WebSocket 連線
      const ws = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("GamePage WebSocket 已連線");
        // 告訴伺服器我進入了遊戲頁
        ws.send(JSON.stringify({ type: "startGame", roomID: id, playerID }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "nextTurn") {
          setCurrentTurn(data.currPlayerID); // 更新目前輪到誰
          if (data.currPlayerID != -1) console.log(`輪到 ${data.players[data.currPlayerID].name}`)
        }
        if (data.type === "chatMessage") {
          const message = {
            id: Date.now(),
            "type": "system",
            "sender": data.playerName,
            "text":`我看見 ${ZHROLE_CONFIG[data.saidRole]} 走向 ${ZHLOCATION_CONFIG[data.nextLocation]}`
          }
          setMessages((prev) => [message, ...prev]);
        }
        if (data.type === "voting") {
          setCurrentTurn(data.currPlayerID);
          const message = {
            id: Date.now(),
            "type": "system",
            "sender": "選角階段結束",
            "text": "進入投票環節，點擊你想投的位置，想棄票就投鍋爐室"
          }
          setMessages((prev) => [message, ...prev]);
        }
        if (data.type === "skillButler") {
          const keep = data.keep;
          const message = {
            id: Date.now(),
            "type": "system",
            "sender": "管家發動技能",
            "text": `${ZHROLE_CONFIG[keep[0]]} 與 ${ZHROLE_CONFIG[keep[1]]} 已先行離去`
          }
          setMessages((prev) => [message, ...prev]);
        }
        if (data.type === "skillDetective") {
          const votedID = data.votedID;
          const message = {
            id: Date.now(),
            "type": "system",
            "sender": "偵探發動技能",
            "text": `接露了 ${votedID === "neutral" ? "客房" : players[votedID].location} 的職業為 ${players[votedID].role}`
          }
          setMessages((prev) => [message, ...prev]);
        }
        if (data.type === "settlement") {
          const judgement = data.finalResult;
          let camp = judgement === 3 ? "壞人" : (judgement === 2 ? "炸彈客" : "好人");
          const message = {
            id: Date.now(),
            "type": "system",
            "sender": "遊戲結束",
            "text": `${camp}陣營獲得勝利!!!`
          }
          setMessages((prev) => [message, ...prev]);
          if (["killer", "accomplice"].includes(confirmedRoleRef.current)) {
            if (judgement === 1) {
              setNotify("你獲得了無期徒刑");
              const audio = new Audio("/sounds/defeat.mp3");
              audio.play();
            }
            else if (judgement === 2) {
              setNotify("你消失在了爆炸的火光中...");
              const audio = new Audio("/sounds/boom.mp3");
              audio.play();
            }
            else {
              setNotify("惡行易施，你勝利了!!!");
              const audio = new Audio("/sounds/victory.mp3");
              audio.play();
            }
          }
          else if (confirmedRoleRef.current === "bomber") {
            if (judgement === 2) {
              setNotify("藝術就是爆炸! 哈哈哈哈哈哈!!!");
              const audio = new Audio("/sounds/boom.mp3");
              audio.play();
            }
            else {
              setNotify("不懂得浪漫的傢伙...");
              const audio = new Audio("/sounds/defeat.mp3");
              audio.play();
            }
          }
          else {
            if (judgement === 1) {
              setNotify("正義必得伸張 你成功抓到壞人了!!!");
              const audio = new Audio("/sounds/victory.mp3");
              audio.play();
            }
            else if (judgement === 2) {
              setNotify("你消失在了爆炸的火光中...");
              const audio = new Audio("/sounds/boom.mp3");
              audio.play();
            }
            else {
              setNotify("兇手仍逍遙法外...");
              const audio = new Audio("/sounds/defeat.mp3");
              audio.play();
            }
          }
        }
      };

      ws.onclose = () => {
        console.log("GamePage WebSocket 已斷線");
      };
    };
    joinGame();
    return () => {
      wsRef.current?.close();
    };
  }, [room.id, playerID]);

  const updateConfirmedRole = (role) => {
    setConfirmedRole(role);           // 更新 state → 觸發 UI 更新
    confirmedRoleRef.current = role;  // 更新 ref → 保證回調拿到最新值
  };

  const handleRectClick = (target) => {
    if (hasVote) return;
    setSelectedTarget(target.id);
  };

  const autoSelectRole = async() => {
    if (confirmedRole) {
      console.log(confirmedRole);
      return;
    }
    try{
      const getResponse = await fetch(`/api/game/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const getData = await getResponse.json();
      updateConfirmedRole(getData.order.order[0]);
      // 先呼叫 selectRole 更新自己角色
      const selectRes = await fetch(`/api/game/${id}/selectRole`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: getData.order.order[0] }),
      });
      if (!selectRes.ok) throw new Error("selectRole API 失敗");

      // 再呼叫 nextPlayer 指定下一位玩家和地點
      const nextRes = await fetch(`/api/game/${id}/nextPlayer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saidRole: getData.order.order[1], nextLocation: getData.availableLocations.length === 0 ? "guestroom" : getData.availableLocations[0] }),
      });
      if (!nextRes.ok) throw new Error("nextPlayer API 失敗");
    } catch (err) {
      console.error(err);
    }
  }

  const clickToVote = async() => {
    setHasVote(true);
    if (selectedTarget === "execute") console.log("你棄票了:(");
    else if (selectedTarget === "neutral") console.log("你投給了客房");
    else console.log(`你投給了在${players[selectedTarget].location} 的 ${players[selectedTarget].name}`);

    try {
      const voteRes = await fetch(`/api/game/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votedID: selectedTarget, playerID: playerID }),
      });
      if (!voteRes.ok) throw new Error("vote API 失敗");
    } catch (err) {
      console.error(err);
    }
  }

  const clickToRestart = async() => {
    try {
      // 刪除room.js的房間
      await fetch(`/api/rooms/${id}/startGame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameStart: false }),
      });
      // 刪除inGame.js的房間
      await fetch(`/api/game/${id}/delRoom`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error(err);
    }
    navigate(`/room/${id}/`, { state: { playerName: players[playerID].name } });
  }

  const useSkill = async(skillRole) => {
    if (skillRole === "detective") {
      try {
        if (selectedTarget === "execute"){
          alert("不可以使用技能投棄票!!!");
        }
        else {
          setHasVote(true);
          const skillRes = await fetch(`/api/game/${id}/skill/detective`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ votedID: selectedTarget, playerID: playerID }),
          });
          if (!skillRes.ok) throw new Error("偵探技能 API 失敗");
        } 
      } catch (err) {
        console.error(err);
      }
    }
    if (skillRole === "butler") {
      try {
        setHasVote(true);
        setSelectedTarget("execute");
        const voteRes = await fetch(`/api/game/${id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ votedID: "execute", playerID: playerID }),
        });
        if (!voteRes.ok) throw new Error("vote API 失敗");
        const skillRes = await fetch(`/api/game/${id}/skill/butler`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ votedID: selectedTarget, playerID: playerID }),
        });
        if (!skillRes.ok) throw new Error("管家技能 API 失敗");
      } catch (err) {
        console.error(err);
      }
    }
  }

  return (
    <div className="gamepage">
      {(notify != null) && (
        <div className="victory-overlay">
          <div className="victory-overlay-box">
            <div>{notify}</div>
            <button onClick={clickToRestart}>返回大廳</button>
          </div>
        </div>
      )}
      <div className="board-container">
        {currentTurn === playerID && !confirmedRole && (
          <div className="select-role-timer">
            <StepTimer
              duration={60}
              onTimeout={() => {
                console.log("時間到，自動選擇");
                autoSelectRole();
              }}
            />
          </div>
        )}
        {(currentTurn === -1) && (!notify) && (
          <div className="vote-timer">
            <StepTimer
              duration={300}
              onTimeout={() => {
                if (!hasVote) {
                  console.log("時間到，自動棄票");
                  setSelectedTarget("execute");
                  clickToVote();
                }
              }}
            />
          </div>
        )}
        {/* 上方玩家區域 */}
        <div className="player-row">
          {room.players.map((p) => (
            <div
              key={p.id}
              className={`rect player-rect ${p.id === playerID ? "self-player" : ""}
              ${p.id === currentTurn ? "active-turn" : ""} 
              ${(selectedTarget === p.id && currentTurn === -1) ? "loc-selected" : ""}`}
              style={{
                backgroundImage: players?.[p.id]?.location
                ? `url(/location/${players[p.id].location}.png)`
                : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              onClick={() => handleRectClick(p)}
            >
              <span className="player-name">{p.name}</span>
            </div>
          ))}
        </div>

        {/* 下方兩個額外長方形 */}
        <div className="extra-row">
          <div className="two-loc">
            <div className={`rect ${(selectedTarget === "neutral" && currentTurn === -1) ? "loc-selected" : ""}`} 
            id="neutral" 
            onClick={() => handleRectClick({"id": "neutral"})}></div>
            <div className={`rect ${(selectedTarget === "execute" && currentTurn === -1) ? "loc-selected" : ""}`}
            id="execute" 
            onClick={() => handleRectClick({"id": "execute"})}>
              <span className={`${currentTurn === -1 ? "" : "hidden"} player-name`}>棄票</span>
            </div>
          </div>
          <button className={`confirm-btn ${currentTurn === -1 ? "" : "hidden"}`} 
          disabled={!selectedTarget || hasVote}
          onClick={() => clickToVote()}>確認投票</button>
        </div>

        <div className="player-UI">
          <div className={"ui-layout"}>
              <div className="select-role-wrapper"
              style={{
                width: currentTurn === playerID ? "70%" : "51%", // 寬度切換
              }}
              >
                {currentTurn !== playerID && !confirmedRole && players &&(
                  <div className="waiting-turn">
                    <h3>現在輪到：{players[currentTurn]?.name}</h3>
                  </div>
                )}

                {currentTurn === playerID && (
                  <SelectRole
                    roomId={id}
                    playerID={playerID}
                    level={room.gameLevel}
                    setConfirmedRole={updateConfirmedRole}
                  />
                )}

                {confirmedRole && (
                  <div className="confirmed-role">
                    <h3>你選擇的是：{ZHROLE_CONFIG[confirmedRole]}</h3>
                    <img
                      src={`/roles/${confirmedRole}.png`}
                      alt={ZHROLE_CONFIG[confirmedRole]}
                      className="role-image"
                    />
                    <p className="role-description">
                      {ROLE_CONFIG[confirmedRole]}
                    </p>
                    {confirmedRole === "detective" && (
                      <button disabled={hasVote || notify || !selectedTarget} onClick={() => useSkill(confirmedRole)}>
                        發動技能
                      </button>
                    )}
                    {confirmedRole === "butler" && (
                      <button disabled={hasVote || notify} onClick={() => useSkill(confirmedRole)}>
                        發動技能
                      </button>
                    )}
                  </div>
                )}
              </div>
            <div className="chatbox-wrapper"
            style={{
                width: currentTurn === playerID ? "30%" : "49%", // 寬度切換
              }}
            >
              <ChatBox messages={messages} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
