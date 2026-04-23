import React from "react";

const PageWrapper = ({ children, className = "" }) => {
  return <div className={`tl-page-wrapper ${className}`.trim()}>{children}</div>;
};

export default PageWrapper;
