import React from "react";
import { Link, NavLink } from "react-router-dom";

const Navbar = () => {
  const isLoggedIn = Boolean(localStorage.getItem("access"));
  const role = localStorage.getItem("role");

  const dashboardPath = role === "FREELANCER" ? "/freelancer-dashboard" : "/client-dashboard";

  return (
    <header className="tl-navbar">
      <div className="tl-navbar-inner">
        <Link className="tl-brand" to="/">
          TalentLink
        </Link>

        <nav className="tl-nav-links">
          <NavLink to="/" className={({ isActive }) => `tl-nav-link ${isActive ? "is-active" : ""}`.trim()}>
            Home
          </NavLink>
          {isLoggedIn ? (
            <NavLink to={dashboardPath} className={({ isActive }) => `tl-nav-link ${isActive ? "is-active" : ""}`.trim()}>
              Dashboard
            </NavLink>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `tl-nav-link ${isActive ? "is-active" : ""}`.trim()}>
                Login
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => `tl-nav-link ${isActive ? "is-active" : ""}`.trim()}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
