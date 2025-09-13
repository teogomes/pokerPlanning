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

interface ParticipantsDrawerProps {
  open: boolean;
  onClose: () => void;
  participants: { id: string; name: string }[];
}

const ParticipantsDrawer: React.FC<ParticipantsDrawerProps> = ({
  open,
  onClose,
  participants,
}) => (
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
    <Card elevation={3} sx={{ m: 2, p: 2, borderRadius: 3, minHeight: 120 }}>
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
    </Card>
  </Drawer>
);

export default ParticipantsDrawer;
