"use client";

import { motion } from "motion/react";

export function HeroSection() {
  function scrollToSelector() {
    document
      .getElementById("patient-selector")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="text-center py-xl w-full bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-5xl font-normal text-forest-dark leading-tight tracking-tight">
          Practice before the
          <br />
          session that <strong>matters</strong>.
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="text-xl font-normal text-forest-medium mt-sm max-w-3xl mx-auto leading-relaxed"
      >
        Roleplay with an AI patient. Get real-time response suggestions. Review
        your approach after every session.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={scrollToSelector}
        className="mt-lg px-sm py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity"
      >
        Get Started
      </motion.button>
    </section>
  );
}
