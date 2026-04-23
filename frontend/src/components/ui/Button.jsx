import React from "react";
import "../../styles/ui.css";

const ALLOWED_VARIANTS = ["primary", "secondary", "ghost"];

const Button = ({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  className = "",
}) => {
  const safeVariant = ALLOWED_VARIANTS.includes(variant) ? variant : "primary";
  const variantClass = `tl-ui-btn--${safeVariant}`;
  const classes = ["tl-ui-btn", variantClass, className].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      aria-busy={loading}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
};

export default Button;
