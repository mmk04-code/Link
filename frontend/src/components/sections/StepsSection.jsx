import React from "react";
import Card from "../ui/Card";

const StepsSection = ({ title, items }) => {
  return (
    <section className="home-steps" aria-label={title}>
      <h2 className="home-section-title">{title}</h2>
      <div className="home-steps-grid">
        {items.map((item) => (
          <Card key={item.id} className="home-step-card">
            <span className="home-step-index">{item.id}</span>
            <h3>{item.title}</h3>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default StepsSection;
