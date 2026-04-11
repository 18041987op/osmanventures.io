"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ExternalLink, Layers, GraduationCap, Bot } from "lucide-react";

interface Project {
  title: string;
  description: string;
  tech: string[];
  url: string;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
}

const projects: Project[] = [
  {
    title: "AutoRx Management Portal",
    description:
      "Complete business management system for the auto repair shop. Handles payroll, employee management, analytics, and integration with QuickBooks.",
    tech: ["Next.js 15", "Supabase", "TypeScript", "Tailwind CSS"],
    url: "https://management.autorxcenter.com",
    features: [
      "Payroll processing and reports",
      "Employee management system",
      "Real-time analytics dashboard",
      "Tool inventory tracking",
      "Vendor bills management",
      "QuickBooks integration",
    ],
    icon: <Layers className="w-8 h-8" />,
    gradient: "from-blue-600 via-indigo-600 to-violet-600",
    accentColor: "blue",
  },
  {
    title: "AutoRx Training Platform",
    description:
      "Comprehensive employee training and HR platform with bilingual support. Features AI-powered coaching, assessments, and tool borrowing system.",
    tech: ["React", "Express.js", "Supabase", "i18n", "TypeScript"],
    url: "https://training.autorxcenter.com",
    features: [
      "Interactive training modules",
      "AI-powered coaching system",
      "Skills assessments",
      "Tool borrowing workflow",
      "HR self-service portal",
      "Bilingual interface (EN/ES)",
    ],
    icon: <GraduationCap className="w-8 h-8" />,
    gradient: "from-purple-600 via-pink-600 to-rose-600",
    accentColor: "purple",
  },
  {
    title: "Emma AI — Business Assistant",
    description:
      "Intelligent AI assistant that learns business patterns and helps with financial management, bill tracking, and strategic insights.",
    tech: ["Next.js", "Prisma", "OpenAI/Claude", "QuickBooks API"],
    url: "https://emma.autorxcenter.com",
    features: [
      "P&L analysis and forecasting",
      "Automated bill tracking",
      "Spending alerts and insights",
      "AI-powered morning briefings",
      "Voice command support",
      "Memory system that learns",
    ],
    icon: <Bot className="w-8 h-8" />,
    gradient: "from-emerald-600 via-cyan-600 to-blue-600",
    accentColor: "emerald",
  },
];

export default function Projects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  return (
    <section
      id="projects"
      ref={ref}
      className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d18] to-[#0a0a0f]" />
      <div className="absolute inset-0 bg-grid opacity-50" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 space-y-4"
        >
          <p className="text-indigo-400 font-mono text-sm uppercase tracking-wider">// Projects</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Featured{" "}
            <span className="gradient-text">Work</span>
          </h2>
          <p className="text-slate-500 max-w-xl">
            Real applications running in production, serving a real business every day.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="space-y-8"
        >
          {projects.map((project) => (
            <motion.div
              key={project.title}
              variants={itemVariants}
              className="group glass rounded-2xl overflow-hidden hover-glow"
            >
              <div className="grid lg:grid-cols-5 gap-0">
                {/* Visual Side */}
                <div className={`lg:col-span-2 bg-gradient-to-br ${project.gradient} p-8 lg:p-10 flex flex-col justify-between min-h-[280px] relative overflow-hidden`}>
                  {/* Pattern overlay */}
                  <div className="absolute inset-0 bg-grid opacity-20" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />

                  <div className="relative z-10">
                    <div className="text-white/80 mb-4">{project.icon}</div>
                    <h3 className="text-2xl font-bold text-white">{project.title}</h3>
                  </div>

                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium group/link transition-colors"
                  >
                    View Live
                    <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>
                </div>

                {/* Content Side */}
                <div className="lg:col-span-3 p-8 lg:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <p className="text-slate-400 leading-relaxed">{project.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {project.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-slate-500">
                          <span className="w-1 h-1 bg-indigo-500 rounded-full flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.tech.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-full"
                      >
                        {tech}
                      </span>
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
