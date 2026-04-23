import React from "react";
import Container from "./Container";
import Navbar from "./Navbar";
import PageWrapper from "./PageWrapper";

const MainLayout = ({ children, showNavbar = true, contained = true, className = "" }) => {
  return (
    <PageWrapper className={className}>
      {showNavbar ? <Navbar /> : null}
      {contained ? <Container>{children}</Container> : children}
    </PageWrapper>
  );
};

export default MainLayout;
