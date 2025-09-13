// src/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io("https://pokerplanning-5pb7.onrender.com/");
  }
  return socket;
}
