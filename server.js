import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://pokerplanning-5pb7.onrender.com",
  "https://poker-planning-di9x05ydq-teogomes-projects.vercel.app",
  "https://poker-planning-git-master-teogomes-projects.vercel.app",
  "https://poker-planning-indol.vercel.app",
];

app.use(cors({ origin: allowedOrigins }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// rooms[roomId] = { users: { [socketId]: { name, browserId } }, seats: [{ id, occupiedBy }], votes: { [socketId]: value }, revealed: boolean }
const rooms = {};

io.on("connection", (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id}`);
  let currentRoom = null;
  const userId = socket.id;

  socket.on("join-room", ({ roomId, name, browserId }) => {
    if (!roomId || !name || !browserId) return;
    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: {},
        seats: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        votes: {},
        revealed: false,
        admin: browserId, // first user is admin
      };
    }
    // Prevent duplicate join from same browserId
    if (Object.keys(rooms[roomId].users).includes(browserId)) {
      socket.emit("join-denied", "Already joined from another tab or device");
      return;
    }
    currentRoom = roomId;
    rooms[roomId].users[browserId] = { name, browserId, socketId: socket.id };
    socket.join(roomId);
    console.log(`[ROOM] User joined: name="${name}", roomId="${roomId}"`);
    updateRoomUsers(roomId);
    updateRoomSeats(roomId);
    // Also emit seats directly to the joining socket
    socket.emit("room-seats", rooms[roomId].seats);
    // Emit votes state (hidden unless revealed)
    emitRoomVotes(roomId);
  });

  socket.on("add-user", ({ roomId, name, browserId }) => {
    if (!roomId || !rooms[roomId]) return;
    if (Object.keys(rooms[roomId].users).includes(browserId)) {
      return;
    }
    rooms[roomId].users[browserId] = { name, browserId, socketId: socket.id };
    updateRoomUsers(roomId);
    updateRoomSeats(roomId);
    emitRoomVotes(roomId);
  });

  socket.on("vote", ({ roomId, value, userId }) => {
    if (!roomId || !rooms[roomId] || !userId) return;
    rooms[roomId].votes[userId] = value;
    emitRoomVotes(roomId);
  });

  socket.on("reveal-votes", ({ roomId }) => {
    if (!roomId || !rooms[roomId]) return;
    // Emit a 'revealing' event to all clients in the room
    io.to(roomId).emit("revealing");
    rooms[roomId].revealed = true;
    emitRoomVotes(roomId);
  });

  socket.on("reset-votes", ({ roomId }) => {
    if (!roomId || !rooms[roomId]) return;
    rooms[roomId].votes = {};
    rooms[roomId].revealed = false;
    emitRoomVotes(roomId);
  });

  socket.on("leave-room", ({ roomId, userId: browserId }) => {
    if (roomId && rooms[roomId] && rooms[roomId].users[browserId]) {
      // Remove user from seats
      rooms[roomId].seats = rooms[roomId].seats.map((seat) =>
        seat.occupiedBy === browserId
          ? { ...seat, occupiedBy: undefined }
          : seat
      );
      delete rooms[roomId].users[browserId];
      socket.leave(roomId);
      cleanupRoom(roomId);
      updateRoomSeats(roomId);
    }
  });

  socket.on("disconnect", () => {
    // Remove user by socketId
    if (currentRoom && rooms[currentRoom]) {
      const browserId = Object.keys(rooms[currentRoom].users).find(
        (bid) => rooms[currentRoom].users[bid].socketId === socket.id
      );
      if (browserId) {
        rooms[currentRoom].seats = rooms[currentRoom].seats.map((seat) =>
          seat.occupiedBy === browserId
            ? { ...seat, occupiedBy: undefined }
            : seat
        );
        delete rooms[currentRoom].users[browserId];
        cleanupRoom(currentRoom);
        updateRoomSeats(currentRoom);
      }
    }
  });

  socket.on("select-seat", ({ roomId, seatId, userId: browserId }) => {
    if (!roomId || !rooms[roomId] || !browserId) return;
    // Remove user from any previous seat
    rooms[roomId].seats = rooms[roomId].seats.map((seat) =>
      seat.occupiedBy === browserId ? { ...seat, occupiedBy: undefined } : seat
    );
    // Assign seat if not already taken
    let seatAssigned = false;
    rooms[roomId].seats = rooms[roomId].seats.map((seat) => {
      if (seat.id === seatId && !seat.occupiedBy) {
        seatAssigned = true;
        return { ...seat, occupiedBy: browserId };
      }
      return seat;
    });
    if (!seatAssigned) {
      console.log(
        `[SERVER] Seat ${seatId} could not be assigned (already occupied)`
      );
    }
    updateRoomSeats(roomId);
  });

  // Chat support
  socket.on("chat-message", ({ roomId, user, message }) => {
    if (!roomId || !rooms[roomId] || !user || !message) return;
    // Broadcast to all in the room
    io.to(roomId).emit("chat-message", {
      user,
      message,
      timestamp: Date.now(),
    });
  });

  function updateRoomUsers(roomId) {
    const userList = Object.entries(rooms[roomId].users).map(
      ([browserId, u]) => ({
        id: browserId,
        name: u.name,
      })
    );
    io.to(roomId).emit("room-users", {
      users: userList,
      admin: rooms[roomId].admin,
    });
  }

  function updateRoomSeats(roomId) {
    if (!rooms[roomId]) return;
    io.to(roomId).emit("room-seats", rooms[roomId].seats);
  }

  function emitRoomVotes(roomId) {
    if (!rooms[roomId]) return;
    const { votes, revealed, users } = rooms[roomId];
    // Only send votes as values if revealed, otherwise send null or '?' for each user
    const voteState = Object.keys(users).map((browserId) => ({
      id: browserId,
      value: votes[browserId],
    }));
    io.to(roomId).emit("room-votes", { votes: voteState, revealed });
  }

  function cleanupRoom(roomId) {
    if (Object.keys(rooms[roomId].users).length === 0) {
      delete rooms[roomId];
    } else {
      updateRoomUsers(roomId);
      updateRoomSeats(roomId);
      emitRoomVotes(roomId);
    }
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT);
