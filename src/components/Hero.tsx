"use client";

import { motion } from "framer-motion";
import { ChevronRight, ChevronDown } from "lucide-react";

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid" />

      {/* Glowing Orbs */}
      <div className="glow-orb w-96 h-96 bg-indigo-600 top-1/4 -left-48 pulse-glow" />
      <div className="glow-orb w-80 h-80 bg-purple-600 bottom-1/4 -right-40 pulse-glow" style={{ animationDelay: "2s" }} />
      <div className="glow-orb w-64 h-64 bg-cyan-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pulse-glow" style={{ animationDelay: "1s", opacity: 0.15 }} />

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 6}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            opacity: 0.3 + Math.random() * 0.4,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-6xl w-full px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Terminal-style intro */}
          <motion.div variants={itemVariants} className="flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-sm">~/portfolio</span>
            <span className="text-slate-600 font-mono text-sm">$</span>
            <span className="text-emerald-400 font-mono text-sm">whoami</span>
            <span className="w-2 h-4 bg-emerald-400 cursor-blink inline-block" />
          </motion.div>

          {/* Main Heading */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold leading-tight">
              <span className="gradient-text">Osman</span>
            </h1>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl text-slate-400 font-light">
              Full-Stack Developer
              <span className="text-indigo-400"> & </span>
              Business Owner
            </h2>
          </motion.div>

          {/* Tagline */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-slate-500 max-w-2xl leading-relaxed"
          >
            I build modern web applications and business systems from the ground
            up. Self-taught developer with hands-on experience building a
            complete tech ecosystem for my independent auto repair shop in
            Charlotte, NC.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
            <a
              href="#projects"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
            >
              View Projects
              <ChevronRight className="w-4 h-4" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-slate-700 text-slate-300 rounded-lg font-medium hover:border-indigo-500 hover:text-white hover:bg-indigo-500/10 transition-all duration-300"
            >
              Get in Touch
            </a>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center pt-16"
          >
            <motion.a
              href="#about"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-slate-600 hover:text-indigo-400 transition-colors"
            >
              <span className="text-xs uppercase tracking-widest">Scroll</span>
              <ChevronDown className="w-4 h-4" />
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
