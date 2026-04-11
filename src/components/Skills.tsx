"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Code2,
  Database,
  Brain,
  Wrench,
  Box,
  Terminal,
} from "lucide-react";

interface SkillCategory {
  name: string;
  icon: React.ReactNode;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    name: "Frontend",
    icon: <Code2 className="w-6 h-6" />,
    skills: ["React", "Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion"],
  },
  {
    name: "Backend",
    icon: <Terminal className="w-6 h-6" />,
    skills: ["Node.js", "Express.js", "Prisma", "Supabase", "PostgreSQL"],
  },
  {
    name: "Databases & APIs",
    icon: <Database className="w-6 h-6" />,
    skills: ["Supabase", "PostgreSQL", "QuickBooks API", "RESTful APIs"],
  },
  {
    name: "AI & Integrations",
    icon: <Brain className="w-6 h-6" />,
    skills: ["OpenAI API", "Claude API", "i18n (Internationalization)"],
  },
  {
    name: "Development Tools",
    icon: <Wrench className="w-6 h-6" />,
    skills: ["Git/GitHub", "Vercel", "VS Code", "npm/yarn", "ESLint"],
  },
  {
    name: "Other",
    icon: <Box className="w-6 h-6" />,
    skills: ["Web Push Notifications", "OAuth/SSO", "Email Systems", "Web Scraping"],
  },
];

export default function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section
      id="skills"
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50"
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-bold text-slate-900 mb-16"
        >
          Skills & Technologies
        </motion.h2>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {skillCategories.map((category) => (
            <motion.div
              key={category.name}
              variants={itemVariants}
              className="group"
            >
              <div className="bg-white rounded-xl p-6 h-full border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-indigo-600 group-hover:text-indigo-700 transition-colors">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {category.name}
                  </h3>
                </div>

                <ul className="space-y-2">
                  {category.skills.map((skill) => (
                    <li
                      key={skill}
                      className="text-sm text-slate-600 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
