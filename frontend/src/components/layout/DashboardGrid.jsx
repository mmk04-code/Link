import React from "react";
import "../../styles/ui.css";

/**
 * DashboardGrid
 * 
 * Provides a responsive grid container for dashboard cards and content blocks.
 * Uses CSS Grid with auto-responsive columns based on screen size.
 * 
 * Usage:
 * <DashboardGrid columns={2}>
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </DashboardGrid>
 */
const DashboardGrid = ({ columns = 2, children, className = "" }) => {
  const gridClass = `tl-dashboard-grid tl-dashboard-grid--${columns}col`;
  return <div className={[gridClass, className].filter(Boolean).join(" ")}>{children}</div>;
};

export default DashboardGrid;
