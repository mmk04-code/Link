import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import Card from "../ui/Card";

const FeatureSection = ({ items }) => {
  const navigate = useNavigate();

  return (
    <section className="home-features" aria-label="Features">
      <div className="home-feature-grid">
        {items.map((item) => (
          <Card key={item.title} className="home-feature-card">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <Button variant={item.variant} onClick={() => navigate(item.path)}>
              {item.action}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default FeatureSection;
