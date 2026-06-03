"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Code2, Building2 } from "lucide-react";

interface TimelineItem {
  title: string;
  subtitle: string;
  period: string;
  description: string;
  highlights: string[];
  icon: React.ReactNode;
}

const timeline: TimelineItem[] = [
  {
    title: "Full-Stack Developer",
    subtitle: "Self-Taught & In Practice",
    period: "2024 — Present",
    description:
      "Serious commitment to mastering full-stack development, building production applications with modern technologies.",
    highlights: [
      "Built 4 complete web applications serving a real business",
      "Integrated complex APIs (QuickBooks, OpenAI, Claude)",
      "Designed and implemented scalable database schemas",
      "Deployed and maintained production systems on Vercel",
      "Learned rapidly through hands-on problem-solving",
    ],
    icon: <Code2 className="w-5 h-5" />,
  },
  {
    title: "Business Owner & Operator",
    subtitle: "AutoRx Center — Charlotte, NC",
    period: "2018 — Present",
    description:
      "Founded and operated an independent auto repair shop. Gained deep understanding of business operations, customer management, and strategic decision-making.",
    highlights: [
      "Built business from ground up",
      "Managed team of skilled technicians",
      "Handled finances, payroll, and operations",
      "Identified technology gaps in workflow",
      "Initiated tech transformation initiative",
    ],
    icon: <Building2 className="w-5 h-5" />,
  },
];

export default function Experience() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  };

  return (
    <section
      id="experience"
      ref={ref}
      className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d18] to-[#0a0a0f]" />
      <div className="glow-orb w-80 h-80 bg-purple-600 bottom-0 -left-40 pulse-glow" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 space-y-4"
        >
          <p className="text-indigo-400 font-mono text-sm uppercase tracking-wider">{"// Experience"}</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            My{" "}
            <span className="gradient-text">Journey</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="space-y-8"
        >
          {timeline.map((item, index) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              className="relative"
            >
              <div className="flex gap-6 sm:gap-8">
                {/* Timeline Line & Dot */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 relative z-10">
                    {item.icon}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-px h-full bg-gradient-to-b from-indigo-500/40 to-transparent mt-2" />
                  )}
                </div>

                {/* Content Card */}
                <div className="glass rounded-xl p-6 sm:p-8 flex-1 mb-4 hover-glow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{item.title}</h3>
                      <p className="text-sm text-indigo-400">{item.subtitle}</p>
                    </div>
                    <span className="text-sm text-slate-500 font-mono">{item.period}</span>
                  </div>

                  <p className="text-slate-400 mb-5 leading-relaxed">{item.description}</p>

                  <div className="space-y-2">
                    {item.highlights.map((highlight) => (
                      <div key={highlight} className="flex items-start gap-2 text-sm text-slate-500">
                        <span className="text-emerald-400 mt-0.5">&#10003;</span>
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
