import { motion } from "framer-motion";
import { Zap, Leaf, Globe, Coins } from "lucide-react";

const reasons = [
  { icon: Zap, title: "Не просто игра", desc: "Каждое действие в игре влияет на реальную ферму" },
  { icon: Leaf, title: "Не просто теплица", desc: "Геймификация делает уход за растениями увлекательным" },
  { icon: Globe, title: "Уникальная синхронизация", desc: "Реальный и виртуальный мир работают в связке" },
  { icon: Coins, title: "Доступно каждому", desc: "Без дачи и больших вложений — всё через подписку" },
];

const WhyCoolSection = () => (
  <section className="py-20 bg-card">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Почему это круто</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Qunar объединяет лучшее из игр и реального земледелия
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {reasons.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-4 p-5 rounded-xl bg-background shadow-soft"
          >
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <r.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold mb-1">{r.title}</h3>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyCoolSection;
