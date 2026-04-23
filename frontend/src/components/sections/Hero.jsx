import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

const Hero = ({ hero }) => {
  const navigate = useNavigate();

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <h1 id="home-hero-title" className="home-hero-title">{hero.title}</h1>
      <p className="home-hero-subtitle">{hero.subtitle}</p>
      <div className="home-hero-actions">
        <Button
          variant={hero.primaryAction.variant}
          onClick={() => navigate(hero.primaryAction.path)}
        >
          {hero.primaryAction.label}
        </Button>
        <Button
          variant={hero.secondaryAction.variant}
          onClick={() => navigate(hero.secondaryAction.path)}
        >
          {hero.secondaryAction.label}
        </Button>
      </div>
    </section>
  );
};

export default Hero;
