import './App.css'

import { BrowserRouter, Routes, Route } from "react-router-dom";
import LobbyPage from "./pages/LobbyPage";
import RoomPage from "./pages/RoomPage";
import GamePage from "./pages/GamePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/room/:id" element={<RoomPage />} />
        <Route path="/room/:id/game" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
