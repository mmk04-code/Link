import React from "react";
import Hero from "../components/sections/Hero";
import FeatureSection from "../components/sections/FeatureSection";
import StepsSection from "../components/sections/StepsSection";
import CTASection from "../components/sections/CTASection";
import { homeData } from "../data/homeData";
import "./Home.css";

const Home = () => {
  return (
    <main className="home-page">
      <Hero hero={homeData.hero} />
      <FeatureSection items={homeData.features} />
      <StepsSection title={homeData.stepsTitle} items={homeData.steps} />
      <CTASection cta={homeData.cta} />
    </main>
  );
};

export default Home;
