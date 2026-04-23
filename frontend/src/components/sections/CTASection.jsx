import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

const CTASection = ({ cta }) => {
  const navigate = useNavigate();

  return (
    <section className="home-cta" aria-label="Call to action">
      <h2>{cta.title}</h2>
      <p>{cta.description}</p>
      <Button variant={cta.variant} onClick={() => navigate(cta.path)}>
        {cta.action}
      </Button>
    </section>
  );
};

export default CTASection;
