import React from "react";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";

interface BurgerMenuProps {
  onClick: () => void;
  ariaLabel?: string;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ onClick, ariaLabel }) => (
  <IconButton
    edge="start"
    color="inherit"
    aria-label={ariaLabel || "menu"}
    onClick={onClick}
    sx={{ display: { xs: "flex", md: "none" }, ml: 1 }}
  >
    <MenuIcon fontSize="large" />
  </IconButton>
);

export default BurgerMenu;
