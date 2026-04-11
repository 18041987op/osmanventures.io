"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section
      id="about"
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={variants}
          className="space-y-6"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            About Me
          </h2>

          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              I'm a self-taught full-stack developer and business owner based in
              Charlotte, NC. What started as a need to solve problems in my own
              business—an independent auto repair shop—evolved into building a
              complete technology ecosystem from the ground up.
            </p>

            <p>
              In 2024, I committed to learning software development seriously. I
              now combine technical expertise with real-world business acumen,
              having lived through the challenges of scaling a business. This
              unique perspective shapes how I approach problem-solving: building
              tools that are not just technically sound, but genuinely solve
              business problems.
            </p>

            <p>
              My stack is modern and production-ready: Next.js for full-stack
              applications, React for interactive frontends, Node.js for
              scalable backends, and Supabase for rapid database development.
              I'm comfortable integrating third-party APIs (QuickBooks, OpenAI,
              Claude) and building features that bridge complex business
              workflows.
            </p>

            <p>
              I believe in clean code, user-centered design, and shipping
              products that work. When I'm not coding, I'm running AutoRx,
              learning new technologies, or thinking about the next problem to
              solve.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
