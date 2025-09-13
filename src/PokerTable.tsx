import React, { useState, useRef, useEffect } from "react";
import Button from "@mui/material/Button";
import { getSocket } from "./socket";

export interface Seat {
  id: number;
  occupiedBy?: string;
}

interface PokerTableProps {
  seats: Seat[];
  onSeatSelect: (seatId: number) => void;
  participants?: { id: string; name: string }[];
  votes: { id: string; value: string | null }[];
  votesRevealed: boolean;
  roomId: string;
  onVote: (value: string | null) => void;
  onReset: () => void;
}

const VOTE_OPTIONS = ["1", "2", "3", "5", "8", "13", "21", "?", "☕️"];

const PokerTable: React.FC<PokerTableProps> = ({
  roomId,
  seats,
  onSeatSelect,
  participants = [],
  votes,
  votesRevealed,
  onVote,
  onReset,
}) => {
  const socketId = getSocket().id || "";
  // Find current user's seat
  const mySeat = seats.find((s) => s.occupiedBy === socketId);
  const myVote = votes.find((v) => v.id === socketId)?.value || null;

  // Countdown and animation state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [localRevealed, setLocalRevealed] = useState(false);
  const countdownTimeout = useRef<NodeJS.Timeout | null>(null);

  // ...existing code...
  const seatPositions = [
    { x: 0.5, y: 0.08 }, // top
    { x: 0.88, y: 0.25 }, // top-right
    { x: 0.88, y: 0.75 }, // bottom-right
    { x: 0.5, y: 0.92 }, // bottom
    { x: 0.12, y: 0.75 }, // bottom-left
    { x: 0.12, y: 0.25 }, // top-left
  ];

  // A round is in progress if at least one vote is cast and votes are not revealed

  // Start countdown (shared by button and socket event)
  const startCountdown = () => {
    setCountdown(3);
    setLocalRevealed(false);
    let n = 3;
    const tick = () => {
      n -= 1;
      if (n > 0) {
        setCountdown(n);
        countdownTimeout.current = setTimeout(tick, 700);
      } else {
        setCountdown(null);
        setFlipping(true);
        setTimeout(() => {
          setFlipping(false);
          setLocalRevealed(true);
        }, 700); // flip duration
      }
    };
    countdownTimeout.current = setTimeout(tick, 700);
  };

  // Listen for 'revealing' event from server
  useEffect(() => {
    const socket = getSocket();
    const onRevealing = () => {
      if (!votesRevealed && countdown === null) {
        startCountdown();
      }
    };
    socket.on("revealing", onRevealing);
    return () => {
      socket.off("revealing", onRevealing);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votesRevealed, countdown]);

  // Button triggers server event
  const handleReveal = () => {
    if (votesRevealed || votes.length === 0 || countdown !== null) return;
    getSocket().emit("reveal-votes", { roomId: roomId });
  };

  // Flip cards back on reset
  useEffect(() => {
    if (!votesRevealed) {
      setLocalRevealed(false);
    }
  }, [votesRevealed]);

  React.useEffect(() => {
    return () => {
      if (countdownTimeout.current) clearTimeout(countdownTimeout.current);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 500,
            height: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Poker table shape */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 340,
              height: 180,
              transform: "translate(-50%, -50%)",
              background: "#15803d",
              borderRadius: 9999,
              border: "8px solid #14532d",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              zIndex: 0,
            }}
          />
          {/* Render 6 seats around the table */}
          {seats.map((seat, idx) => {
            const pos = seatPositions[idx];
            const isOccupied = !!seat.occupiedBy;
            const occupant = participants.find((p) => p.id === seat.occupiedBy);
            return (
              <div
                key={seat.id}
                style={{
                  position: "absolute",
                  left: `calc(${pos.x * 100}% - 2.2rem)`,
                  top: `calc(${pos.y * 100}% - 2.2rem)`,
                  width: 70,
                  height: 70,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  zIndex: 10,
                }}
              >
                {isOccupied ? (
                  <>
                    {(() => {
                      const v = votes.find(
                        (vote) => vote.id === seat.occupiedBy
                      );
                      if (!v || v.value === undefined || v.value === null) {
                        // No vote: show card placeholder
                        return (
                          <div
                            style={{
                              width: 36,
                              height: 48,
                              borderRadius: 6,
                              background: "#f3f4f6",
                              border: "2px dashed #94a3b8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 18,
                              color: "#64748b",
                              boxShadow: "0 2px 8px #64748b22",
                            }}
                          >
                            🂠
                          </div>
                        );
                      } else {
                        // Has vote: show colored card with true 3D flip (front/back)
                        const flipTransform = localRevealed
                          ? "rotateY(180deg)"
                          : "none";
                        return (
                          <div
                            style={{
                              perspective: "400px",
                              width: 36,
                              height: 48,
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 48,
                                position: "relative",
                                transformStyle: "preserve-3d",
                                transition:
                                  "transform 0.7s cubic-bezier(.5,1.8,.5,1)",
                                transform: flipTransform,
                              }}
                            >
                              {/* Front face (hidden after flip) */}
                              <div
                                style={{
                                  position: "absolute",
                                  width: 36,
                                  height: 48,
                                  borderRadius: 6,
                                  border: "2px solid #fff",
                                  boxShadow: "0 2px 8px #2563eb44",
                                  fontWeight: 800,
                                  fontSize: 20,
                                  color: "#fff",
                                  background: "#fbbf24",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backfaceVisibility: "hidden",
                                  zIndex: 2,
                                }}
                              >
                                🂠
                              </div>
                              {/* Back face (revealed after flip) */}
                              <div
                                style={{
                                  position: "absolute",
                                  width: 36,
                                  height: 48,
                                  borderRadius: 6,
                                  border: "2px solid #fff",
                                  boxShadow: "0 2px 8px #2563eb44",
                                  fontWeight: 800,
                                  fontSize: 20,
                                  color: "#fff",
                                  background: "#2563eb",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backfaceVisibility: "hidden",
                                  transform: "rotateY(180deg)",
                                  zIndex: 3,
                                }}
                              >
                                {v.value}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })()}
                    <span
                      style={{
                        fontSize: 13,
                        color: "#fff",
                        fontWeight: 700,
                        marginTop: 4,
                        textShadow: "0 1px 4px #0008",
                        letterSpacing: 0.2,
                        maxWidth: 60,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {participants.find((p) => p.id === seat.occupiedBy)
                        ?.name || seat.occupiedBy}
                    </span>
                  </>
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 10,
                      boxShadow: "0 2px 8px #64748b22",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onClick={() => onSeatSelect(seat.id)}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#d1d5db")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "#e5e7eb")
                    }
                    title="Take this seat"
                  >
                    <span
                      style={{
                        fontSize: 28,
                        color: "#a3a3a3",
                        filter: "drop-shadow(0 1px 2px #22c55e88)",
                        userSelect: "none",
                      }}
                    >
                      {"+"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {/* Reveal Cards button or countdown in the center */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              pointerEvents: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 120,
              minHeight: 80,
            }}
          >
            {countdown !== null ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 120,
                  height: 80,
                  background: "rgba(255,255,255,0.92)",
                  borderRadius: 16,
                  boxShadow: "0 4px 32px #fbbf2444, 0 1.5px 8px #2563eb22",
                  border: "2.5px solid #fbbf24",
                  animation: "pop 0.7s cubic-bezier(.5,1.8,.5,1) forwards",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: 54,
                    fontWeight: 900,
                    color: "#fbbf24",
                    textShadow: "0 2px 12px #fbbf2444, 0 1px 2px #fff",
                    letterSpacing: 2,
                    transition: "all 0.3s",
                    animation: "countdown-scale 0.7s cubic-bezier(.5,1.8,.5,1)",
                  }}
                >
                  {countdown}
                </span>
                <style>{`
                  @keyframes countdown-scale {
                    0% { transform: scale(0.7); opacity: 0.5; }
                    60% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  @keyframes pop {
                    0% { box-shadow: 0 0 0 #fbbf2444; }
                    100% { box-shadow: 0 4px 32px #fbbf2444, 0 1.5px 8px #2563eb22; }
                  }
                `}</style>
              </div>
            ) : (
              <Button
                variant="contained"
                color="info"
                size="large"
                sx={{
                  borderRadius: 3,
                  fontWeight: 800,
                  fontSize: 22,
                  px: 4,
                  py: 1.5,
                  boxShadow: 4,
                }}
                onClick={handleReveal}
                disabled={
                  votesRevealed ||
                  votes.filter((v) => v.value)?.length < 1 ||
                  countdown !== null
                }
              >
                Reveal Cards
              </Button>
            )}
          </div>
        </div>
        {/* Show Start New button only when cards are revealed and not revealing */}
        {votesRevealed && countdown === null && !flipping && (
          <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
            <Button
              variant="contained"
              color="success"
              size="medium"
              sx={{ borderRadius: 2, fontWeight: 700 }}
              onClick={onReset}
            >
              Start New
            </Button>
          </div>
        )}
      </div>
      {/* Voting options bar at the bottom */}
      {mySeat && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            background: "rgba(255,255,255,0.95)",
            borderTop: "1px solid #e5e7eb",
            padding: "1rem 0",
            display: "flex",
            justifyContent: "center",
            gap: 12,
            zIndex: 50,
            boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {VOTE_OPTIONS.map((opt) => (
            <div
              key={opt}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                marginBottom: myVote === opt ? 12 : 0,
                transition: "margin-bottom 0.25s cubic-bezier(.5,1.8,.5,1)",
              }}
            >
              <Button
                variant={myVote === opt ? "contained" : "outlined"}
                color={myVote === opt ? "primary" : "inherit"}
                size="large"
                sx={{
                  width: 48,
                  height: 64,
                  borderRadius: 2,
                  fontWeight: "bold",
                  fontSize: 20,
                  boxShadow:
                    myVote === opt
                      ? "0 2px 8px #2563eb44"
                      : "0 2px 8px rgba(0,0,0,0.08)",
                  cursor: votesRevealed ? "not-allowed" : "pointer",
                  minWidth: 0,
                  p: 0,
                  transition: "all 0.25s cubic-bezier(.5,1.8,.5,1)",
                  transform:
                    myVote === opt ? "translateY(-12px) scale(1.08)" : "none",
                  zIndex: myVote === opt ? 2 : 1,
                }}
                onClick={() => onVote(myVote === opt ? null : opt)}
                disabled={votesRevealed}
              >
                {opt}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PokerTable;
