import React from "react";
import "../../styles/ui.css";

const Card = ({ children, className = "" }) => {
  return <div className={["tl-ui-card", className].filter(Boolean).join(" ")}>{children}</div>;
};

export default Card;
