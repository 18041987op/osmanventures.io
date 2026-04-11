"use client";

import { Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">Osman</h3>
            <p className="text-sm text-slate-600">
              Full-stack developer & business owner in Charlotte, NC.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Links
            </h4>
            <ul className="space-y-1">
              <li>
                <a
                  href="#about"
                  className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#projects"
                  className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Projects
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Connect
            </h4>
            <div className="flex gap-4">
              <a
                href="https://github.com/18041987op"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium"
                aria-label="GitHub"
              >
                GitHub
              </a>
              <a
                href="mailto:autorxcenter@gmail.com"
                className="text-slate-600 hover:text-indigo-600 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-600 text-center">
            © {currentYear} Osman. Built with Next.js, Tailwind CSS, and Framer
            Motion.
          </p>
        </div>
      </div>
    </footer>
  );
}
