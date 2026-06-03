"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, MapPin, Send, GitBranch } from "lucide-react";

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setFormStatus("loading");
    const formData = new FormData(form);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      // Honeypot field — left empty by real users.
      company: formData.get("company"),
    };
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setFormStatus("success");
        form.reset();
        setTimeout(() => setFormStatus("idle"), 3000);
      } else {
        setFormStatus("error");
        setTimeout(() => setFormStatus("idle"), 4000);
      }
    } catch {
      setFormStatus("error");
      setTimeout(() => setFormStatus("idle"), 4000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section
      id="contact"
      ref={ref}
      className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="glow-orb w-96 h-96 bg-indigo-600 bottom-0 left-1/2 -translate-x-1/2 pulse-glow" style={{ opacity: 0.15 }} />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-indigo-400 font-mono text-sm uppercase tracking-wider">// Contact</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Let&apos;s{" "}
            <span className="gradient-text">Connect</span>
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Have a project in mind or want to discuss an opportunity? I&apos;d love to hear from you.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid md:grid-cols-5 gap-8"
        >
          {/* Contact Info */}
          <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
            <a
              href="mailto:osman@osmanventures.io"
              className="glass rounded-xl p-5 flex items-center gap-4 group hover-glow block"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/30 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="text-white group-hover:text-indigo-300 transition-colors text-sm">osman@osmanventures.io</p>
              </div>
            </a>

            <a
              href="https://github.com/18041987op"
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-xl p-5 flex items-center gap-4 group hover-glow block"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/30 transition-colors">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">GitHub</p>
                <p className="text-white group-hover:text-indigo-300 transition-colors text-sm">18041987op</p>
              </div>
            </a>

            <div className="glass rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="text-white text-sm">Charlotte, NC</p>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="md:col-span-3 glass rounded-xl p-6 sm:p-8 space-y-5"
          >
            <div>
              <label htmlFor="name" className="block text-sm text-slate-400 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-slate-400 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm text-slate-400 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                placeholder="Tell me about your project..."
              />
            </div>

            {/* Honeypot field — hidden from users, traps bots */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={formStatus === "loading"}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {formStatus === "loading" ? (
                "Sending..."
              ) : formStatus === "success" ? (
                "Message sent!"
              ) : formStatus === "error" ? (
                "Error — try again"
              ) : (
                <>
                  Send Message
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>

            {formStatus === "success" && (
              <p className="text-sm text-emerald-400 text-center">
                Thanks for reaching out! I&apos;ll get back to you soon.
              </p>
            )}
          </motion.form>
        </motion.div>
      </div>
    </section>
  );
}
