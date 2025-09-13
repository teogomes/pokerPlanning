import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import BurgerMenu from "./BurgerMenu";
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
  // browserId is only for deduplication, not for session identity
  const [browserId, setBrowserId] = useState<string>("");
  const [votes, setVotes] = useState<{ id: string; value: string | null }[]>(
    []
  );
  const [votesRevealed, setVotesRevealed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [adminId, setAdminId] = useState<string | null>(null);
  useEffect(() => {
    const socket = getSocket();
    socket.on("room-seats", (serverSeats: Seat[]) => {
      setSeats(serverSeats);
    });
    socket.on("room-votes", ({ votes: serverVotes, revealed }) => {
      setVotes(serverVotes);
      setVotesRevealed(revealed);
    });
    socket.on("room-users", ({ users, admin }) => {
      setParticipants(users);
      setAdminId(admin);
    });

    // On mount, check if user was in a room and auto-rejoin
    const lastRoom = localStorage.getItem("pp:lastRoomId");
    let id = localStorage.getItem("pp:browserId");
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      localStorage.setItem("pp:browserId", id);
    }
    setBrowserId(id);
    if (lastRoom && id) {
      // Optionally, store/display name in localStorage as well
      const name = localStorage.getItem("pp:name") || "Guest";
      socket.emit("join-room", { roomId: lastRoom, name, browserId: id });
      setJoinedRoom(lastRoom);
    }

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
    setBrowserId(id);
    localStorage.setItem("pp:lastRoomId", roomId);
  };

  const handleCreate = (roomId: string, users: User[]) => {
    setJoinedRoom(roomId);
    setParticipants(users);
    let id = localStorage.getItem("pp:browserId");
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      localStorage.setItem("pp:browserId", id);
    }
    setBrowserId(id);
    localStorage.setItem("pp:lastRoomId", roomId);
  };

  const handleSeatSelect = (seatId: number) => {
    if (!joinedRoom || !browserId) return;
    getSocket().emit("select-seat", {
      roomId: joinedRoom,
      seatId,
      userId: browserId, // use browserId for permanent identity
    });
  };

  const handleVote = (value: string | null) => {
    if (!joinedRoom || !browserId) return;
    getSocket().emit("vote", { roomId: joinedRoom, value, userId: browserId });
  };

  const handleReset = () => {
    if (!joinedRoom) return;
    getSocket().emit("reset-votes", { roomId: joinedRoom });
  };

  // Get my display name from participants (browserId)
  const myUser = participants.find((u) => u.id === browserId);

  const isAdmin = adminId === browserId;
  const isMobile = useMediaQuery("(max-width:600px)");
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 50%, #fef9c3 100%)",
        width: "100vw",
        padding: 0,
        margin: 0,
        overflowX: "hidden",
        overflowY: { xs: "hidden", sm: "auto" },
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Hide scrollbars on mobile */}
      <style>{`
        @media (max-width: 600px) {
          body, #root, .MuiBox-root {
            overflow-x: hidden !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch !important;
          }
          ::-webkit-scrollbar { display: none; }
        }
      `}</style>
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
            minHeight: 56,
            px: { xs: 1, sm: 0 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: -1,
                color: "#1e293b",
                fontSize: { xs: 22, sm: 28 },
              }}
            >
              Planning Poker
            </Typography>
            {joinedRoom && (
              <>
                {!isMobile && (
                  <>
                    <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: "#334155",
                        fontWeight: 700,
                        fontSize: { xs: 13, sm: 16 },
                      }}
                    >
                      Room:{" "}
                      <span style={{ color: "#2563eb" }}>{joinedRoom}</span>
                    </Typography>
                    {myUser && (
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: "#334155",
                          fontWeight: 700,
                          ml: 2,
                          fontSize: { xs: 13, sm: 16 },
                        }}
                      >
                        You:{" "}
                        <span style={{ color: "#0ea5e9" }}>{myUser.name}</span>
                      </Typography>
                    )}
                  </>
                )}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    marginLeft: "auto",
                  }}
                >
                  {isMobile ? (
                    <BurgerMenu
                      onClick={() => setDrawerOpen(true)}
                      ariaLabel="Open participants"
                    />
                  ) : (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="medium"
                      sx={{ fontWeight: 700, borderRadius: 2, ml: 2 }}
                      onClick={() => setDrawerOpen(true)}
                    >
                      Participants
                    </Button>
                  )}
                  {joinedRoom && (
                    <Button
                      variant="contained"
                      color="error"
                      size="medium"
                      sx={{
                        fontWeight: 700,
                        borderRadius: 2,
                        boxShadow: 2,
                        ml: { xs: 0, sm: 2 },
                      }}
                      onClick={() => {
                        setJoinedRoom(null);
                        setParticipants([]);
                        setSeats(getInitialSeats());
                        setBrowserId("");
                        localStorage.removeItem("pp:lastRoomId");
                      }}
                    >
                      Leave
                    </Button>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Container>
        {/* Participants Drawer */}
        <ParticipantsDrawer
          open={drawerOpen}
          roomId={joinedRoom ?? ""}
          currentUser={myUser ?? { id: "", name: "Guest" }}
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
              isAdmin={isAdmin}
              currentUserId={browserId}
            />
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default PlanningPokerApp;
