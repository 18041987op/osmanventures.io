"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Target, Rocket } from "lucide-react";

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const values = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Self-Taught",
      desc: "Learned full-stack development from scratch in 2024, driven by real business needs.",
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Business-Driven",
      desc: "Every line of code solves a real problem — not just tech for tech's sake.",
    },
    {
      icon: <Rocket className="w-5 h-5" />,
      title: "Ship & Iterate",
      desc: "4 production apps built, deployed, and actively serving my business daily.",
    },
  ];

  return (
    <section
      id="about"
      ref={ref}
      className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="space-y-12"
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="space-y-4">
            <p className="text-indigo-400 font-mono text-sm uppercase tracking-wider">// About Me</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              From Wrench to{" "}
              <span className="gradient-text">Code</span>
            </h2>
          </motion.div>

          {/* Story */}
          <motion.div variants={itemVariants} className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-5 text-slate-400 leading-relaxed">
              <p>
                I&apos;m a self-taught full-stack developer and business owner based in
                Charlotte, NC. What started as a need to solve problems in my own
                business — an independent auto repair shop — evolved into building a
                complete technology ecosystem from the ground up.
              </p>
              <p>
                In 2024, I committed to learning software development seriously. I
                now combine technical expertise with real-world business acumen,
                having lived through the challenges of scaling a business. This
                unique perspective shapes how I approach problem-solving: building
                tools that are genuinely useful, not just technically impressive.
              </p>
              <p>
                My stack is modern and production-ready: Next.js, React, Node.js,
                Supabase, and AI integrations (OpenAI, Claude, QuickBooks API). I
                believe in clean code, user-centered design, and shipping products
                that work.
              </p>
            </div>

            {/* Value Cards */}
            <div className="lg:col-span-2 space-y-4">
              {values.map((value) => (
                <motion.div
                  key={value.title}
                  variants={itemVariants}
                  className="glass rounded-xl p-5 hover-glow"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-indigo-400 mt-0.5">{value.icon}</div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{value.title}</h3>
                      <p className="text-sm text-slate-500">{value.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
