import React from 'react';
import { Link } from '@tanstack/react-router';

export default function HeroPolished() {
  return (
    <section className="hero-viewport">
      <div className="hero-container">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">One-click for Asset <span>Defense</span></h1>
          <p className="hero-sub">Dive into the art assets, where innovative blockchain technology meets financial expertise</p>
          <div className="hero-ctas">
            <Link to="/dashboard" className="btn-primary">Open App</Link>
            <button className="btn-secondary">Discover More</button>
          </div>
        </div>
        <canvas className="hero-canvas" />
        <div className="hero-particles" aria-hidden />
      </div>
    </section>
  );
}
