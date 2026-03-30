import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  y?: number;
}

const Stagger = ({
  children,
  className,
  delay = 0,
  stagger = 0.08,
  y = 20,
}: StaggerProps) => {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: prefersReduced ? 0 : y },
            show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default Stagger;
