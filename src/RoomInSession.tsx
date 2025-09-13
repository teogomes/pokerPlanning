import React from "react";
import Stack from "@mui/material/Stack";
import PokerTable from "./PokerTable";

interface RoomInSessionProps {
  roomId: string | null;
  currentUserId: string;
  participants: { id: string; name: string }[];
  seats: { id: number; occupiedBy?: string }[];
  votes: { id: string; value: string | null }[];
  votesRevealed: boolean;
  onSeatSelect: (seatId: number) => void;
  onVote: (value: string | null) => void;
  onReset: () => void;
  isAdmin: boolean;
}

const RoomInSession: React.FC<RoomInSessionProps> = ({
  roomId,
  currentUserId,
  participants,
  seats,
  votes,
  votesRevealed,
  onSeatSelect,
  onVote,
  onReset,
  isAdmin,
}) => {
  return (
    <Stack spacing={2} alignItems="center">
      <PokerTable
        roomId={roomId ?? ""}
        seats={seats}
        onSeatSelect={onSeatSelect}
        participants={participants}
        votes={votes}
        votesRevealed={votesRevealed}
        onVote={onVote}
        onReset={onReset}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />
    </Stack>
  );
};

export default RoomInSession;
