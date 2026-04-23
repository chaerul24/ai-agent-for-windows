import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("web/public"));

io.on("connection", (socket) => {
  socket.on("prompt", (msg) => {
    socket.emit("response", "AI: " + msg);
  });
});

server.listen(3000, () => {
  console.log("🌐 http://localhost:3000");
});