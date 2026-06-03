"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Code2, Database, Brain, Wrench, Terminal, Globe } from "lucide-react";

interface SkillCategory {
  name: string;
  icon: React.ReactNode;
  skills: string[];
  color: string;
}

const skillCategories: SkillCategory[] = [
  {
    name: "Frontend",
    icon: <Code2 className="w-5 h-5" />,
    skills: ["React", "Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Backend",
    icon: <Terminal className="w-5 h-5" />,
    skills: ["Node.js", "Express.js", "Prisma", "REST APIs", "PostgreSQL"],
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Databases",
    icon: <Database className="w-5 h-5" />,
    skills: ["Supabase", "PostgreSQL", "Prisma ORM", "Database Design"],
    color: "from-violet-500 to-purple-500",
  },
  {
    name: "AI & APIs",
    icon: <Brain className="w-5 h-5" />,
    skills: ["OpenAI API", "Claude API", "QuickBooks API", "i18n"],
    color: "from-orange-500 to-rose-500",
  },
  {
    name: "DevOps",
    icon: <Wrench className="w-5 h-5" />,
    skills: ["Git/GitHub", "Vercel", "CI/CD", "npm", "ESLint"],
    color: "from-indigo-500 to-blue-500",
  },
  {
    name: "Other",
    icon: <Globe className="w-5 h-5" />,
    skills: ["Web Push", "OAuth/SSO", "Email Systems", "Web Scraping"],
    color: "from-pink-500 to-rose-500",
  },
];

export default function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section
      id="skills"
      ref={ref}
      className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="glow-orb w-72 h-72 bg-indigo-600 top-1/3 -right-36 pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 space-y-4"
        >
          <p className="text-indigo-400 font-mono text-sm uppercase tracking-wider">{"// Skills"}</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Tech{" "}
            <span className="gradient-text">Stack</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {skillCategories.map((category) => (
            <motion.div
              key={category.name}
              variants={itemVariants}
              className="group"
            >
              <div className="glass rounded-xl p-6 h-full hover-glow relative overflow-hidden">
                {/* Gradient accent top bar */}
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${category.color} opacity-50 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-center gap-3 mb-5">
                  <div className="text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg group-hover:border-indigo-500/30 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
