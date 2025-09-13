import { useEffect, useState, useRef } from "react";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { getSocket } from "./socket";

interface RoomProps {
  onJoin: (roomId: string, users: User[]) => void;
  onCreate: (roomId: string, users: User[]) => void;
  setUsersGlobal?: (users: User[]) => void;
}

interface User {
  id: string;
  name: string;
}

const RoomActions: React.FC<RoomProps> = ({ onJoin, onCreate }) => {
  const [roomId, setRoomId] = useState("1");
  const [newRoomId, setNewRoomId] = useState("");

  const [userName, setUserName] = useState(
    "teo" + Math.random().toString(36).slice(2, 5)
  );
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0); // 0 = Join, 1 = Create
  let id = localStorage.getItem("pp:browserId");
  if (!id) {
    id = Math.random().toString(36).slice(2, 12);
    localStorage.setItem("pp:browserId", id);
  }
  const browserId = useRef<string>(id);

  useEffect(() => {
    const socket = getSocket();
    socket.on("join-denied", (msg: string) => {
      console.error("[RoomActions] Join denied:", msg);
      setError(msg);
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("join-denied");
      socket.offAny();
    };
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (roomId.trim() && userName.trim()) {
      setCurrentRoom(roomId.trim());
      getSocket().emit("join-room", {
        roomId: roomId.trim(),
        name: userName.trim(),
        browserId: browserId.current,
      });
      onJoin(roomId.trim(), []);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newRoomId.trim() && userName.trim()) {
      setCurrentRoom(newRoomId.trim());
      getSocket().emit("join-room", {
        roomId: newRoomId.trim(),
        name: userName.trim(),
        browserId: browserId.current,
      });
      onCreate(newRoomId.trim(), []);
      setNewRoomId("");
    }
  };

  const handleAddUser = () => {
    if (userName.trim() && currentRoom) {
      getSocket().emit("add-user", {
        roomId: currentRoom,
        name: userName.trim(),
        browserId: browserId.current,
      });
      setUserName("");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "8vh",
        minHeight: "100vh",
      }}
    >
      <Card
        elevation={8}
        sx={{
          width: "50vw",
          maxWidth: 700,
          minWidth: 320,
          background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
          color: "#fff",
          borderRadius: 2,
          p: 3,
        }}
      >
        <Stack spacing={3}>
          {error && (
            <Paper
              elevation={2}
              sx={{ p: 2, borderRadius: 2, background: "#fee2e2" }}
            >
              <Typography color="error" fontWeight={700} align="center">
                {error}
              </Typography>
            </Paper>
          )}
          {!currentRoom ? (
            <Stack spacing={2}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ color: "#fff", mb: 0.5 }}
              >
                Choose your display name
              </Typography>
              <TextField
                required
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                size="medium"
                fullWidth
                autoFocus
                sx={{
                  backgroundColor: "#fff",
                  borderRadius: 1,
                  boxShadow: 2,
                  border: "2px solid #1976d2",
                  input: {
                    color: "#222",
                    fontWeight: 600,
                    "::placeholder": { color: "red", opacity: 1 },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "#fff",
                    opacity: 1,
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#1976d2", borderWidth: 2 },
                  },
                }}
              />
              <Divider sx={{ opacity: 0.5 }}>Room Actions</Divider>
              <Stack spacing={2}>
                <Box sx={{ width: "100%" }}>
                  <Button
                    variant={tab === 0 ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => setTab(0)}
                    sx={{ width: "50%", borderRadius: 0 }}
                  >
                    Join Room
                  </Button>
                  <Button
                    variant={tab === 1 ? "contained" : "outlined"}
                    color="success"
                    onClick={() => setTab(1)}
                    sx={{ width: "50%", borderRadius: 0 }}
                  >
                    Create Room
                  </Button>
                </Box>
                {tab === 0 ? (
                  <form onSubmit={handleJoin} style={{ width: "100%" }}>
                    <TextField
                      required
                      placeholder="Room ID"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      size="medium"
                      fullWidth
                      sx={{
                        backgroundColor: "#fff",
                        borderRadius: 1,
                        mb: 2,
                        boxShadow: 2,
                        border: "2px solid #1976d2",
                        input: {
                          color: "#222",
                          fontWeight: 600,
                          "::placeholder": { color: "#fff", opacity: 1 },
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "#fff",
                          opacity: 1,
                        },
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "#1976d2",
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      sx={{ fontWeight: 700, fontSize: 20, borderRadius: 2 }}
                      disabled={!userName.trim() || !roomId.trim()}
                    >
                      Join Room
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleCreate} style={{ width: "100%" }}>
                    <TextField
                      required
                      placeholder="New Room ID"
                      value={newRoomId}
                      onChange={(e) => setNewRoomId(e.target.value)}
                      size="medium"
                      fullWidth
                      sx={{
                        backgroundColor: "#fff",
                        borderRadius: 1,
                        mb: 2,
                        boxShadow: 2,
                        border: "2px solid #43a047",
                        input: {
                          color: "#222",
                          fontWeight: 600,
                          "::placeholder": { color: "#fff", opacity: 1 },
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "#fff",
                          opacity: 1,
                        },
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "#43a047",
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="success"
                      fullWidth
                      size="large"
                      sx={{ fontWeight: 700, fontSize: 20, borderRadius: 2 }}
                      disabled={!userName.trim() || !newRoomId.trim()}
                    >
                      Create Room
                    </Button>
                  </form>
                )}
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2} alignItems="center">
              <Typography
                fontWeight={800}
                sx={{ fontFamily: "monospace", fontSize: 18, color: "#fff" }}
              >
                Room: {currentRoom}
              </Typography>

              <Divider sx={{ opacity: 0.5 }} />
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ width: "100%" }}
              >
                <TextField
                  placeholder="Add another user"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  size="medium"
                  fullWidth
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: 1,
                    boxShadow: 2,
                    border: "2px solid #1976d2",
                    input: {
                      color: "#222",
                      fontWeight: 600,
                      "::placeholder": { color: "#fff", opacity: 1 },
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "#fff",
                      opacity: 1,
                    },
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#1976d2", borderWidth: 2 },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  sx={{
                    minWidth: 100,
                    fontWeight: 700,
                    fontSize: 20,
                    borderRadius: 2,
                  }}
                  onClick={handleAddUser}
                >
                  Add
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Card>
    </div>
  );
};

export default RoomActions;
