import { motion } from "framer-motion";
import { Play } from "lucide-react";

const DemoSection = () => (
  <section className="py-20 bg-background">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Смотри, как это работает</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Виртуальный полив → реальная мини-ферма получает команду → растение растёт
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto"
      >
        <div className="relative aspect-video rounded-2xl bg-card shadow-elevated overflow-hidden border flex items-center justify-center group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Play className="w-7 h-7 text-primary ml-1" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Демо-видео скоро появится</p>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default DemoSection;
