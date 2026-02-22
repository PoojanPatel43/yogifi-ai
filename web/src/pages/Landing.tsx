import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Philosophy from '../components/Philosophy';
import Protocol from '../components/Protocol';
import Pricing from '../components/Pricing';
import Footer from '../components/Footer';

const Landing: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="relative flex flex-col w-full">
        <Hero />
        <Features />
        <Philosophy />
        <Protocol />
        <Pricing />
      </main>
      <Footer />
    </>
  );
};

export default Landing;
