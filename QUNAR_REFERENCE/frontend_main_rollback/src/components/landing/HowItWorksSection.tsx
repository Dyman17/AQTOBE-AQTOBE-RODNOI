import { motion } from "framer-motion";
import { Gamepad2, Cpu, Bot, Trophy } from "lucide-react";

const steps = [
  {
    icon: Gamepad2,
    title: "Unity-игра",
    description: "Сажай и поливай растения в красивой виртуальной среде",
    color: "text-primary",
    bg: "bg-accent",
  },
  {
    icon: Cpu,
    title: "ESP / Мини-ферма",
    description: "Команды из игры управляют реальной теплицей с датчиками",
    color: "text-leaf",
    bg: "bg-accent",
  },
  {
    icon: Bot,
    title: "ИИ-консультант",
    description: "Получай советы по уходу и оптимальному выращиванию",
    color: "text-sky",
    bg: "bg-accent",
  },
  {
    icon: Trophy,
    title: "Прогресс",
    description: "Повышай уровни, открывай достижения и заказывай урожай",
    color: "text-sun",
    bg: "bg-accent",
  },
];

const HowItWorksSection = () => (
  <section className="py-20 bg-background">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Как это работает</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          От виртуального полива до реального урожая — всего 4 шага
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative p-6 rounded-xl bg-card shadow-card hover:shadow-elevated transition-shadow"
          >
            <div className="text-xs font-bold text-muted-foreground mb-3">0{i + 1}</div>
            <div className={`w-12 h-12 rounded-lg ${step.bg} flex items-center justify-center mb-4`}>
              <step.icon className={`w-6 h-6 ${step.color}`} />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
