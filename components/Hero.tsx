"use client";

import { motion } from "framer-motion";

export const Hero = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-4 mb-8"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-4xl md:text-6xl font-display font-bold">
          <span className="text-gradient">Go</span>
          <span className="text-foreground">Figure</span>
        </h1>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto"
      >
        Transform any photo into a{" "}
        <span className="text-secondary font-semibold">fun figurine</span> with
        AI magic
      </motion.p>
    </motion.div>
  );
};
