"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Monitor, Link2, Bot, ArrowRight } from "lucide-react";

interface Service {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

const services: Service[] = [
  {
    icon: <Monitor className="w-5 h-5" />,
    title: "Custom Web Apps",
    description:
      "Full-stack applications tailored to your business. From internal tools to customer-facing platforms. React/Next.js + Supabase.",
    accent: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Link2 className="w-5 h-5" />,
    title: "API & Systems Integration",
    description:
      "Connect your existing tools. QuickBooks, payroll systems, third-party APIs. Built to automate your workflows.",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    icon: <Bot className="w-5 h-5" />,
    title: "AI-Powered Features",
    description:
      "Add intelligent features to your product. Chat assistants, document analysis, automated insights. OpenAI & Claude API.",
    accent: "from-fuchsia-500 to-purple-500",
  },
];

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section
      id="services"
      ref={ref}
      className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d18] to-[#0a0a0f]" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="glow-orb w-80 h-80 bg-fuchsia-600 top-1/4 -left-32 pulse-glow" style={{ opacity: 0.12 }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 space-y-4"
        >
          <p className="text-indigo-400 font-mono text-sm uppercase tracking-wider">{"// Services"}</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Available for{" "}
            <span className="gradient-text">Projects</span>
          </h2>
          <p className="text-slate-500 max-w-xl">
            I take on a limited number of custom projects per year. Here&apos;s what I build:
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid md:grid-cols-3 gap-5 mb-12"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={itemVariants}
              className="group"
            >
              <div className="glass rounded-xl p-6 h-full hover-glow relative overflow-hidden">
                {/* Gradient accent top bar */}
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${service.accent} opacity-50 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/30 transition-colors">
                    {service.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
            Interested in working together? I&apos;m based in Charlotte, NC and
            work with clients remotely.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 flex-shrink-0"
          >
            Let&apos;s Talk
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
