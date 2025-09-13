import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import { getSocket } from "./socket";
import RoomActions from "./RoomActions";
import RoomInSession from "./RoomInSession";
import type { Seat } from "./PokerTable";
import { getInitialSeats } from "./seatUtils";
import ParticipantsDrawer from "./ParticipantsDrawer";

interface User {
  id: string;
  name: string;
}

const PlanningPokerApp: React.FC = () => {
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [seats, setSeats] = useState<Seat[]>(getInitialSeats());
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [votes, setVotes] = useState<{ id: string; value: string | null }[]>(
    []
  );
  const [votesRevealed, setVotesRevealed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    socket.on("room-seats", (serverSeats: Seat[]) => {
      setSeats(serverSeats);
    });
    socket.on("room-votes", ({ votes: serverVotes, revealed }) => {
      setVotes(serverVotes);
      setVotesRevealed(revealed);
    });
    socket.on("room-users", (userList: User[]) => {
      setParticipants(userList);
    });
    return () => {
      socket.off("room-seats");
      socket.off("room-votes");
      socket.off("room-users");
    };
  }, []);

  const handleJoin = (roomId: string, users: User[]) => {
    setJoinedRoom(roomId);
    setParticipants(users);
    let id = localStorage.getItem("pp:browserId");
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      localStorage.setItem("pp:browserId", id);
    }
    setCurrentUserId(id);
  };

  const handleCreate = (roomId: string, users: User[]) => {
    setJoinedRoom(roomId);
    setParticipants(users);
    let id = localStorage.getItem("pp:browserId");
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      localStorage.setItem("pp:browserId", id);
    }
    setCurrentUserId(id);
  };

  const handleSeatSelect = (seatId: number) => {
    if (!joinedRoom || !currentUserId) return;
    getSocket().emit("select-seat", {
      roomId: joinedRoom,
      seatId,
      userId: currentUserId,
    });
  };

  const handleVote = (value: string | null) => {
    if (!joinedRoom) return;
    getSocket().emit("vote", { roomId: joinedRoom, value });
  };

  const handleReset = () => {
    if (!joinedRoom) return;
    getSocket().emit("reset-votes", { roomId: joinedRoom });
  };

  // Get my display name from participants (currentUserId)
  const myUser = participants.find((u) => u.id === currentUserId);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 50%, #fef9c3 100%)",
        width: "100vw",
        padding: 0,
        margin: 0,
      }}
    >
      {/* Sticky header with title, roomId, display name, and Leave button */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          left: 0,
          width: "100vw",
          zIndex: 100,
          background: "rgba(255,255,255,0.95)",
          borderBottom: "1.5px solid #e0e7ef",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          py: 1.5,
          px: 0,
          mb: 2,
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: -1, color: "#1e293b" }}
            >
              Planning Poker
            </Typography>
            {joinedRoom && (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                <Typography
                  variant="subtitle2"
                  sx={{ color: "#334155", fontWeight: 700 }}
                >
                  Room: <span style={{ color: "#2563eb" }}>{joinedRoom}</span>
                </Typography>
                {myUser && (
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#334155", fontWeight: 700, ml: 2 }}
                  >
                    You: <span style={{ color: "#0ea5e9" }}>{myUser.name}</span>
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  color="primary"
                  size="medium"
                  sx={{ fontWeight: 700, borderRadius: 2, ml: 2 }}
                  onClick={() => setDrawerOpen(true)}
                >
                  Participants
                </Button>
              </>
            )}
          </Box>
          {joinedRoom && (
            <Button
              variant="contained"
              color="error"
              size="medium"
              sx={{ fontWeight: 700, borderRadius: 2, boxShadow: 2 }}
              onClick={() => {
                setJoinedRoom(null);
                setParticipants([]);
                setSeats(getInitialSeats());
                setCurrentUserId("");
              }}
            >
              Leave
            </Button>
          )}
        </Container>
        {/* Participants Drawer */}
        <ParticipantsDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          participants={participants}
        />
      </Box>
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={2} alignItems="center">
          {!joinedRoom ? (
            <RoomActions
              onJoin={handleJoin}
              onCreate={handleCreate}
              setUsersGlobal={setParticipants}
            />
          ) : (
            <RoomInSession
              participants={participants}
              seats={seats}
              votes={votes}
              votesRevealed={votesRevealed}
              onSeatSelect={handleSeatSelect}
              onVote={handleVote}
              onReset={handleReset}
              roomId={joinedRoom}
            />
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default PlanningPokerApp;
