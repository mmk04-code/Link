import React from "react";
import "../../styles/ui.css";

/**
 * DashboardLayout
 * 
 * Provides a standard layout structure for dashboard pages:
 * - Optional header section (title, actions)
 * - Main content area
 * - Responsive container with token-based spacing
 * 
 * Usage:
 * <DashboardLayout
 *   header={{ title: "My Projects", actions: <Button>Add</Button> }}
 *   children={/* page content */}
 * />
 */
const DashboardLayout = ({ header, children, className = "" }) => {
  return (
    <div className={["tl-dashboard-page", className].filter(Boolean).join(" ")}>
      {header ? (
        <div className="tl-dashboard-header">
          {header.title ? <h1 className="tl-dashboard-title">{header.title}</h1> : null}
          {header.subtitle ? <p className="tl-dashboard-subtitle">{header.subtitle}</p> : null}
          {header.actions ? <div className="tl-dashboard-actions">{header.actions}</div> : null}
        </div>
      ) : null}

      <div className="tl-dashboard-content">{children}</div>
    </div>
  );
};

export default DashboardLayout;
