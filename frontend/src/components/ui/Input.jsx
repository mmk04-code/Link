import React from "react";
import "../../styles/ui.css";

const Input = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  name,
  disabled = false,
  endAdornment = null,
}) => {
  const inputId = id || name || `tl-input-${label || "field"}`;

  return (
    <div className="tl-ui-field">
      {label ? (
        <label className="tl-ui-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}

      <div className="tl-ui-input-wrap">
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`tl-ui-input ${error ? "is-error" : ""}`.trim()}
        />
        {endAdornment ? <div className="tl-ui-input-adornment">{endAdornment}</div> : null}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="tl-ui-input-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default Input;
