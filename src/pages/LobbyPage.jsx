import { useNavigate } from "react-router-dom";
import CONFIG from "../config/config.json";
import Lobby from "../components/Lobby";

export default function LobbyPage() {
  const navigate = useNavigate();

  const onCreateRoom = (id, name) => {
    if (id.length !== 4) {
      alert("請輸入 4 位數字的 RoomID");
      return;
    }
    if (!name || !name.trim()) {
      alert("玩家名稱不能為空");
      return;
    }
    navigate(`/room/${id}`, { state: { playerName: name.trim() } });
  };

  const onJoinRoom = async (id, name) => {
    if (id.length !== 4) {
      alert("請輸入 4 位數字的 RoomID");
      return;
    }
    if (!name || !name.trim()) {
      alert("玩家名稱不能為空");
      return;
    }

    try {
      // 呼叫後端 API 檢查房間狀態
      const res = await fetch(`${CONFIG["host"]}/api/rooms/${id}`);
      if (!res.ok) throw new Error("伺服器錯誤");
      const data = await res.json();

      if (data.players.length === 0) {
        alert("房間不存在或尚未有玩家建立！");
        return;
      }
      if (data.players.length >= data.maxPlayers) {
        alert("房間人數已滿，無法加入！");
        return;
      }

      // 通過檢查才跳轉
      navigate(`/room/${id}`, { state: { playerName: name } });
    } catch (err) {
      console.error(err);
      alert("無法檢查房間狀態，請稍後再試。");
    }
  };

  return (
    <Lobby onCreateRoom={onCreateRoom} onJoinRoom={onJoinRoom} />
  );
}
