import { motion, useReducedMotion } from "framer-motion";

// A short fade-in. Used where something appears because the person asked for it (a scan result).
export default function AnimatedCard({ children, className = "", delay = 0 }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      {children}
    </motion.div>
  );
}
