"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { ExternalLink, Sparkles } from "lucide-react";

interface Project {
  title: string;
  description: string;
  tech: string[];
  url?: string;
  features: string[];
  image?: string;
  gradient: string;
  badge?: string;
  isOwnProduct?: boolean;
}

const projects: Project[] = [
  {
    title: "RunTech — Auto Shop Management SaaS",
    description:
      "All-in-one modular SaaS platform for independent auto repair shops, born inside AutoRx Center in Charlotte, NC — where it now runs the entire operation. Each module can be enabled or disabled per client subscription.",
    tech: ["Next.js", "Supabase", "TypeScript", "AI Integration"],
    url: "https://runtech.run",
    features: [
      "Modular — plug in features per subscription",
      "Shop operations, customer & vehicle tracking",
      "Built-in CRM",
      "Integrated phone system",
      "Run Pay — payment processing gateway",
      "RunPayroll — payroll & technician management",
      "Emma AI — built-in business assistant",
      "Training & HR platform (EN/ES)",
    ],
    image: "/images/management.jpg",
    gradient: "from-indigo-600/30 to-fuchsia-600/30",
    badge: "In Production",
    isOwnProduct: true,
  },
  {
    title: "Ulua Loans",
    description:
      "Lending platform for managing loans end to end \u2014 from origination and client records to payment schedules and collections tracking.",
    tech: ["Next.js", "Supabase", "TypeScript", "Tailwind CSS"],
    url: "https://prestamos.runtech.app",
    features: [
      "Loan origination & tracking",
      "Payment schedules & reminders",
      "Client management",
      "Balance & interest calculations",
      "Reporting dashboard",
      "Secure role-based access",
    ],
    gradient: "from-emerald-600/20 to-cyan-600/20",
    isOwnProduct: true,
  },
  {
    title: "AR-CHomes.com",
    description:
      "Business website built for AR-C Homes \u2014 a modern, responsive site designed to showcase their work and turn visitors into leads.",
    tech: ["Next.js", "Tailwind CSS", "Vercel"],
    url: "https://ar-chomes.com",
    features: [
      "Modern responsive design",
      "Project & services showcase",
      "Lead capture contact forms",
      "SEO-optimized pages",
      "Fast load performance",
      "Mobile-first experience",
    ],
    gradient: "from-amber-600/20 to-orange-600/20",
    badge: "Client Project",
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
          <p className="text-indigo-400 font-mono text-sm uppercase tracking-wider">{"// Projects"}</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Featured{" "}
            <span className="gradient-text">Work</span>
          </h2>
          <p className="text-slate-500 max-w-xl">
            Real applications running in production, serving real businesses every day.
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
                {/* Screenshot Side */}
                <div className={`lg:col-span-2 relative min-h-[280px] overflow-hidden bg-gradient-to-br ${project.gradient}`}>
                  {/* App screenshot */}
                  {project.image && (
                    <Image
                      src={project.image}
                      alt={`${project.title} screenshot`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                  {/* Overlay on hover */}
                  <div className={`absolute inset-0 ${project.image ? "bg-black/40 group-hover:bg-black/20" : "bg-black/20 group-hover:bg-black/10"} transition-colors duration-500`} />

                  {/* Badges (top-right) */}
                  {(project.badge || project.isOwnProduct) && (
                    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                      {project.isOwnProduct && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-200 bg-fuchsia-500/20 border border-fuchsia-400/40 rounded-full backdrop-blur-sm">
                          <Sparkles className="w-3 h-3" />
                          Own SaaS
                        </span>
                      )}
                      {project.badge && (
                        <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200 bg-emerald-500/20 border border-emerald-400/40 rounded-full backdrop-blur-sm">
                          {project.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Title + link overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between p-8 lg:p-10 z-10">
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg pr-24">{project.title}</h3>
                    {project.url ? (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium group/link transition-colors"
                      >
                        View Live
                        <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </a>
                    ) : (
                      <span className="text-white/60 text-sm font-medium">Private Platform</span>
                    )}
                  </div>
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
