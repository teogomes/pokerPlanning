import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PlanningPokerApp from "./PlanningPokerApp.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlanningPokerApp />
  </StrictMode>
);
