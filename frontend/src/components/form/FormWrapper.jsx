import React from "react";
import "../../styles/ui.css";

const FormWrapper = ({ children, className = "", onSubmit }) => {
  return (
    <form onSubmit={onSubmit} className={["tl-ui-form", className].filter(Boolean).join(" ")}>
      {children}
    </form>
  );
};

export default FormWrapper;
