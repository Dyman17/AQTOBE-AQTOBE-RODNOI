import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout, Gamepad2, Droplets } from "lucide-react";

const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center bg-hero-gradient overflow-hidden">
    {/* Decorative floating elements */}
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-[15%] text-leaf/20"
      >
        <Sprout className="w-16 h-16" />
      </motion.div>
      <motion.div
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-32 left-[10%] text-water/20"
      >
        <Droplets className="w-12 h-12" />
      </motion.div>
      <motion.div
        animate={{ y: [-5, 15, -5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-[70%] text-sun/20"
      >
        <Gamepad2 className="w-14 h-14" />
      </motion.div>
    </div>

    <div className="container relative z-10">
      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
            <Sprout className="w-4 h-4" />
            Smart Farm Game
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            Играй и выращивай{" "}
            <span className="text-gradient-primary">настоящие растения</span>{" "}
            дистанционно
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg">
            Qunar — уникальная синхронизация виртуальной Unity-игры и реальной мини-фермы с ESP-контроллерами. Сажай, поливай, собирай урожай — всё по-настоящему.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/register">Попробовать бесплатно</Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/about">Подробнее</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
