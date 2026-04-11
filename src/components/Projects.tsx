"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ExternalLink } from "lucide-react";

interface Project {
  title: string;
  description: string;
  tech: string[];
  url: string;
  features: string[];
  gradient: string;
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
    gradient: "from-blue-500 to-cyan-500",
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
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Emma AI - Personal Business Assistant",
    description:
      "Intelligent AI assistant that learns your business patterns and helps with financial management, bill tracking, and strategic insights.",
    tech: [
      "Next.js",
      "Prisma",
      "OpenAI/Claude",
      "QuickBooks API",
      "Supabase",
    ],
    url: "https://emma.autorxcenter.com",
    features: [
      "P&L analysis and forecasting",
      "Automated bill tracking",
      "Spending alerts and insights",
      "AI-powered morning briefings",
      "Voice command support",
      "Proactive suggestions",
      "Memory system",
    ],
    gradient: "from-orange-500 to-red-500",
  },
];

export default function Projects() {
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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section
      id="projects"
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-bold text-slate-900 mb-16"
        >
          Featured Projects
        </motion.h2>

        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="space-y-12"
        >
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              variants={itemVariants}
              className="group"
            >
              <div className="grid md:grid-cols-2 gap-8 items-stretch">
                {/* Visual */}
                <div
                  className={`bg-gradient-to-br ${project.gradient} rounded-xl h-80 md:h-full relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      {project.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {project.description}
                    </p>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Key Features
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {project.features.map((feature) => (
                          <li
                            key={feature}
                            className="text-sm text-slate-600 flex items-start gap-2"
                          >
                            <span className="text-indigo-600 mt-1">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Tech Stack */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium group/link"
                    >
                      View Live Site
                      <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </a>
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
