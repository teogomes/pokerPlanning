// This file manages the seat state for the poker table, to be used in PlanningPokerApp
import type { Seat } from "./PokerTable";

export function getInitialSeats(): Seat[] {
  return [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
}
