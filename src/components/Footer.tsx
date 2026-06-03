"use client";

import { GitBranch, Mail } from "lucide-react";
import { siteConfig } from "@/lib/site";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[#08080d]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold gradient-text">{siteConfig.initials}</span>
            <span className="text-sm text-slate-600">|</span>
            <span className="text-sm text-slate-500">{siteConfig.domain}</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="#about"
              className="text-sm text-slate-500 hover:text-white transition-colors"
            >
              About
            </a>
            <a
              href="#projects"
              className="text-sm text-slate-500 hover:text-white transition-colors"
            >
              Projects
            </a>
            <a
              href="#services"
              className="text-sm text-slate-500 hover:text-white transition-colors"
            >
              Services
            </a>
            <a
              href="#contact"
              className="text-sm text-slate-500 hover:text-white transition-colors"
            >
              Contact
            </a>

            <span className="text-slate-800">|</span>

            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <GitBranch className="w-4 h-4" />
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-slate-500 hover:text-white transition-colors"
              aria-label="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-600">
            &copy; {currentYear} Osman. Built with Next.js, Tailwind CSS &amp; Framer Motion.
          </p>
        </div>
      </div>
    </footer>
  );
}
