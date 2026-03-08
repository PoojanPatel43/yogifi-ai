import React from 'react';
import { useReveal } from '../hooks/useReveal';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Philosophy from '../components/Philosophy';
import Protocol from '../components/Protocol';
import Pricing from '../components/Pricing';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import BrutalistCursor from '../components/BrutalistCursor';
import BrutalistMarquee from '../components/BrutalistMarquee';

const Landing: React.FC = () => {
  useReveal();

  return (
    <>
      {/* ── Custom mix-blend-difference cursor (pointer devices only) ──── */}
      <BrutalistCursor />
      <Navbar />
      <main className="relative flex flex-col w-full">
        <Hero />
        <Features />
        <Philosophy />
        <Protocol />
        <Pricing />
        {/* ── Brutalist marquee band between Pricing and CTA ──────────── */}
        <BrutalistMarquee />
        <CTA />
      </main>
      <Footer />
    </>
  );
};

export default Landing;
