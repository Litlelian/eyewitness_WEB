import express from "express";
import cors from "cors";
import roomsRouter from "./routes/room.js";

const PORT = 8001;
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/rooms", roomsRouter);

app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
