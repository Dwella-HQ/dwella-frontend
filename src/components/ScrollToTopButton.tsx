"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const SCROLL_THRESHOLD = 320;

export const ScrollToTopButton = () => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          key="scroll-to-top"
          initial={{ opacity: 0, y: 24, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={scrollToTop}
          aria-label="Scroll back to top"
          className="fixed bottom-6 right-6 z-[80] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0D4B73] to-[#1F93D0] text-white shadow-[0_12px_32px_rgba(13,75,115,0.35)] ring-2 ring-white/70 backdrop-blur-sm transition hover:shadow-[0_16px_40px_rgba(31,147,208,0.45)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1F93D0]/60"
        >
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </motion.span>
          <span className="pointer-events-none absolute inset-0 rounded-full bg-white/10 opacity-0 transition group-hover:opacity-100" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
};
