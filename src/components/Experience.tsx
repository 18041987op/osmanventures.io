"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface TimelineItem {
  title: string;
  subtitle: string;
  period: string;
  description: string;
  highlights: string[];
}

const timeline: TimelineItem[] = [
  {
    title: "Full-Stack Developer",
    subtitle: "Self-Taught & In Practice",
    period: "2024 — Present",
    description:
      "Serious commitment to mastering full-stack development, building production applications with modern technologies.",
    highlights: [
      "Built 3 complete web applications serving a real business",
      "Integrated complex APIs (QuickBooks, OpenAI, Claude)",
      "Designed and implemented scalable database schemas",
      "Deployed and maintained production systems on Vercel",
      "Learned rapidly through hands-on problem-solving",
    ],
  },
  {
    title: "Business Owner & Operator",
    subtitle: "AutoRx Center — Independent Auto Repair Shop",
    period: "2018 — Present",
    description:
      "Founded and operated an independent auto repair shop in Charlotte, NC. Gained deep understanding of business operations, customer management, and strategic decision-making.",
    highlights: [
      "Built business from ground up",
      "Managed team of skilled technicians",
      "Handled finances, payroll, and operations",
      "Identified technology gaps in workflow",
      "Initiated tech transformation initiative",
    ],
  },
];

export default function Experience() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section
      id="experience"
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-bold text-slate-900 mb-16"
        >
          Experience
        </motion.h2>

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
              {/* Timeline marker */}
              <div className="flex gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-indigo-600 rounded-full border-4 border-white relative z-10" />
                  {index < timeline.length - 1 && (
                    <div className="w-1 h-24 bg-slate-200 mt-4" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 flex-1">
                  <div className="space-y-3 mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-indigo-600 font-medium">
                        {item.subtitle}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">{item.period}</p>
                  </div>

                  <p className="text-slate-600 mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  <ul className="space-y-2">
                    {item.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="text-sm text-slate-600 flex items-start gap-2"
                      >
                        <span className="text-indigo-600 mt-1">✓</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
