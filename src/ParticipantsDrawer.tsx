import React from "react";
import Drawer from "@mui/material/Drawer";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { getSocket } from "./socket";

interface ParticipantsDrawerProps {
  open: boolean;
  onClose: () => void;
  participants: { id: string; name: string }[];
  roomId: string;
  currentUser: { id: string; name: string };
}

const ParticipantsDrawer: React.FC<ParticipantsDrawerProps> = ({
  open,
  onClose,
  participants,
  roomId,
  currentUser,
}) => {
  const [messages, setMessages] = React.useState<
    { user: { id: string; name: string }; message: string; timestamp: number }[]
  >([]);
  const [input, setInput] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const socket = getSocket();
    const handler = (msg: any) => {
      console.log("🚀 ~ handler ~ msg:", msg);
      setMessages((prev) => [...prev, msg]);
    };
    socket.on("chat-message", handler);
    return () => {
      socket.off("chat-message", handler);
    };
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const socket = getSocket();
    socket.emit("chat-message", {
      roomId,
      user: currentUser,
      message: trimmed,
    });
    setInput("");
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: 300,
          boxShadow: 4,
          borderLeft: "2px solid #e0e7ef",
          background: "#f8fafc",
        },
      }}
      sx={{ display: { xs: "none", md: "block" } }}
    >
      <Card
        elevation={3}
        sx={{
          m: 2,
          p: 2,
          borderRadius: 3,
          minHeight: 120,
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 32px)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="h6" fontWeight={800} color="primary.main">
            Participants
          </Typography>
          <IconButton onClick={onClose} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <List dense>
          {participants.length === 0 && (
            <ListItem>
              <ListItemText
                primary={
                  <Typography color="text.secondary">
                    No participants yet
                  </Typography>
                }
              />
            </ListItem>
          )}
          {participants.map((u) => (
            <ListItem key={u.id}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "#6366f1" }}>
                  {u.name[0]?.toUpperCase() || "?"}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={<Typography fontWeight={700}>{u.name}</Typography>}
                secondary={u.id}
              />
            </ListItem>
          ))}
        </List>
        {/* Chat section */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            mt: 2,
            mb: 1,
            bgcolor: "#f1f5f9",
            borderRadius: 2,
            p: 1,
            minHeight: 120,
          }}
        >
          {messages.length === 0 && (
            <Typography
              color="text.secondary"
              fontSize={14}
              align="center"
              mt={2}
            >
              No messages yet
            </Typography>
          )}
          {messages.map((msg, i) => (
            <Box
              key={i}
              sx={{
                mb: 1,
                display: "flex",
                flexDirection: "column",
                alignItems:
                  msg.user.id === currentUser.id ? "flex-end" : "flex-start",
              }}
            >
              <Box
                sx={{
                  bgcolor:
                    msg.user.id === currentUser.id ? "#6366f1" : "#e0e7ef",
                  color: msg.user.id === currentUser.id ? "#fff" : "#222",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  maxWidth: 220,
                  wordBreak: "break-word",
                  fontSize: 14,
                }}
              >
                <b>{msg.user.name}:</b> {msg.message}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: 10, mt: 0.2 }}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        <Box
          component="form"
          onSubmit={sendMessage}
          sx={{ display: "flex", gap: 1 }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              borderRadius: 8,
              border: "1px solid #e0e7ef",
              padding: "6px 10px",
              fontSize: 15,
            }}
            maxLength={200}
            autoComplete="off"
          />
          <button
            type="submit"
            style={{
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </Box>
      </Card>
    </Drawer>
  );
};

export default ParticipantsDrawer;
