import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/motion/Reveal";
import Stagger from "@/components/motion/Stagger";
import { useI18n } from "@/context/I18nContext";
import {
  Sprout,
  Droplets,
  Monitor,
  Bot,
  Activity,
  Camera,
  BookOpen,
  BarChart3,
  Zap,
  FileText,
  BadgeCheck,
  Cpu,
  LineChart,
  Truck,
  Building2,
  Clock3,
  ShieldAlert,
  TrendingUp,
  Globe2,
  Leaf,
  Gamepad2,
  Sun,
} from "lucide-react";

const Feature = ({
  icon: Icon,
  children,
  tone = "default",
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  tone?: "default" | "light";
}) => {
  const iconClass = tone === "light" ? "text-emerald-100" : "text-emerald-600";
  const textClass = tone === "light" ? "text-emerald-50" : "text-muted-foreground";
  return (
    <li className={`flex items-start gap-2 ${textClass}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} />
      <span>{children}</span>
    </li>
  );
};

const heroContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const Index = () => {
  const { t, language } = useI18n();
  const problemCopy = {
    en: {
      badge: "Problem",
      title: "The problem Qunar solves",
      subtitle: "People want eco food, but most lack land, time, or knowledge.",
      cardCityTitle: "Dependence on stores",
      cardCityDesc: "City residents rely on mass-production supply.",
      cardTimeTitle: "Long logistics",
      cardTimeDesc: "Food travels a long chain before it reaches people.",
      cardTrustTitle: "No control of growing",
      cardTrustDesc: "People cannot see how and where their food is grown.",
    },
    ru: {
      badge: "Проблема",
      title: "Проблема, которую решает Qunar",
      subtitle:
        "Люди хотят экологичную еду, но у большинства нет земли, времени или знаний, чтобы выращивать её самостоятельно.",
      cardCityTitle: "Зависимость от магазинов",
      cardCityDesc: "Городские жители зависят от массового производства продуктов питания.",
      cardTimeTitle: "Длинная логистика",
      cardTimeDesc: "Еда проходит длинную цепочку поставок, прежде чем попасть к потребителю.",
      cardTrustTitle: "Отсутствие контроля за выращиванием",
      cardTrustDesc: "Люди не могут видеть, как и где выращивается их еда.",
    },
    kk: {
      badge: "Мәселе",
      title: "Qunar шешетін мәселе",
      subtitle:
        "Адамдар экологиялық таза тағамды қалайды, бірақ көпшілігінде оны өздері өсіруге жер, уақыт немесе білім жоқ.",
      cardCityTitle: "Дүкендерге тәуелділік",
      cardCityDesc: "Қала тұрғындары жаппай өндірілетін азық-түлікке тәуелді.",
      cardTimeTitle: "Ұзақ логистика",
      cardTimeDesc: "Тағам тұтынушыға жеткенше ұзақ жеткізу тізбегінен өтеді.",
      cardTrustTitle: "Өсіру процесін бақылаудың болмауы",
      cardTrustDesc: "Адамдар өз тағамының қалай және қай жерде өсірілгенін көре алмайды.",
    },
  } as const;
  const problemText = problemCopy[language] ?? problemCopy.en;
  const macroCopy = {
    en: {
      title: "Market opportunity",
      subtitle: "Smart agriculture is growing and demand for transparent food is rising.",
      marketTitle: "Smart agriculture",
      marketDesc: "The smart‑agro market keeps growing globally.",
      urbanTitle: "Urbanization",
      urbanDesc: "More people live in cities without land to farm.",
      organicTitle: "Organic demand",
      organicDesc: "People want healthy, traceable food.",
      trustTitle: "Transparency",
      trustDesc: "Users expect visibility into how food is grown.",
    },
    ru: {
      title: "Рыночная возможность",
      subtitle: "Умное сельское хозяйство быстро развивается, а спрос на прозрачную еду растёт.",
      marketTitle: "Умное сельское хозяйство",
      marketDesc: "Рынок smart-agriculture быстро растёт по всему миру.",
      urbanTitle: "Урбанизация",
      urbanDesc: "Всё больше людей живут в городах и не имеют земли для выращивания продуктов.",
      organicTitle: "Спрос на органическую еду",
      organicDesc: "Люди всё чаще хотят здоровую и отслеживаемую еду.",
      trustTitle: "Прозрачность",
      trustDesc: "Пользователи ожидают прозрачности и возможности видеть процесс выращивания еды.",
    },
    kk: {
      title: "Нарық мүмкіндігі",
      subtitle: "Ақылды ауыл шаруашылығы дамып, ашық тағамға сұраныс артуда.",
      marketTitle: "Ақылды ауыл шаруашылығы",
      marketDesc: "Smart-agriculture нарығы бүкіл әлемде жылдам өсіп жатыр.",
      urbanTitle: "Урбанизация",
      urbanDesc: "Барған сайын көп адам қалаларда өмір сүреді және жерге қол жеткізе алмайды.",
      organicTitle: "Органикалық тағамға сұраныс",
      organicDesc: "Адамдар пайдалы әрі қадағаланатын тағамды қалайды.",
      trustTitle: "Ашықтық",
      trustDesc: "Пайдаланушылар тағамның қалай өсірілетінін көргісі келеді және ашық ақпарат күтеді.",
    },
  } as const;
  const macroText = macroCopy[language] ?? macroCopy.en;
  const competitionCopy = {
    en: {
      title: "Competition",
      subtitle: "How Qunar compares to other smart farming solutions.",
      othersTitle: "Other solutions",
      othersIntro:
        "There are platforms related to smart farming, online agriculture, and farm management, but most focus only on monitoring, analytics, or equipment sales.",
      othersPoint1Title: "Limited user involvement",
      othersPoint1Desc:
        "Many existing solutions are designed for professional farmers and do not let ordinary users participate in growing.",
      othersPoint2Title: "No real interaction",
      othersPoint2Desc:
        "In most cases, users can only watch data and statistics without direct control over cultivation.",
      advantageTitle: "Qunar Advantage",
      advantagePoint1Title: "Interactive farming",
      advantagePoint1Desc:
        "Qunar lets users interact with a real farm through a game-like digital interface.",
      advantagePoint2Title: "Real-world impact",
      advantagePoint2Desc:
        "Every action in the digital environment affects real plants on a physical farm.",
      advantagePoint3Title: "Accessible for everyone",
      advantagePoint3Desc:
        "Designed for farmers and urban residents who want to grow food remotely.",
      advantagePoint4Title: "Transparency and trust",
      advantagePoint4Desc:
        "Users track the full growing process and receive verified crop data.",
      othersTag1: "Monitoring only",
      othersTag2: "No direct control",
      othersTag3: "Hardware focused",
      advantageTag1: "Game + IoT",
      advantageTag2: "Live sensors",
      advantageTag3: "Harvest delivery",
    },
    ru: {
      title: "Конкуренция",
      subtitle: "Сравнение Qunar с другими решениями умного фермерства.",
      othersTitle: "Другие решения",
      othersIntro:
        "Есть платформы про smart farming, онлайн‑агро и управление фермами, но они чаще всего про мониторинг, аналитику или продажу оборудования.",
      othersPoint1Title: "Ограниченное вовлечение",
      othersPoint1Desc:
        "Многие решения рассчитаны на профессиональных фермеров и не дают обычным людям участвовать в выращивании.",
      othersPoint2Title: "Нет реального взаимодействия",
      othersPoint2Desc:
        "Обычно пользователи видят лишь данные и статистику, но не могут управлять выращиванием напрямую.",
      advantageTitle: "Преимущество Qunar",
      advantagePoint1Title: "Интерактивное фермерство",
      advantagePoint1Desc:
        "Qunar позволяет взаимодействовать с реальной фермой через игровую цифровую среду.",
      advantagePoint2Title: "Реальный эффект",
      advantagePoint2Desc:
        "Каждое действие в цифровой среде связано с настоящими растениями на ферме.",
      advantagePoint3Title: "Доступно каждому",
      advantagePoint3Desc:
        "Платформа подходит не только фермерам, но и городским жителям, желающим выращивать еду удаленно.",
      advantagePoint4Title: "Прозрачность и доверие",
      advantagePoint4Desc:
        "Пользователь видит полный цикл выращивания и получает подтвержденные данные.",
      othersTag1: "Только мониторинг",
      othersTag2: "Без управления",
      othersTag3: "Оборудование",
      advantageTag1: "Игра + IoT",
      advantageTag2: "Live-сенсоры",
      advantageTag3: "Доставка урожая",
    },
    kk: {
      title: "Бәсекелестік",
      subtitle: "Qunar-ды басқа smart farming шешімдерімен салыстыру.",
      othersTitle: "Басқа шешімдер",
      othersIntro:
        "Smart farming, онлайн‑агро және ферма басқару платформалары бар, бірақ көпшілігі тек мониторинг, аналитика немесе жабдық сатуға бағытталған.",
      othersPoint1Title: "Қатысу шектеулі",
      othersPoint1Desc:
        "Көптеген шешімдер кәсіби фермерлерге арналған және қарапайым адамдарды өсіруге қоспайды.",
      othersPoint2Title: "Нақты өзара әрекет жоқ",
      othersPoint2Desc:
        "Көп жағдайда пайдаланушылар тек деректерді көре алады, бірақ өсіруді тікелей басқара алмайды.",
      advantageTitle: "Qunar артықшылығы",
      advantagePoint1Title: "Интерактивті фермерлік",
      advantagePoint1Desc:
        "Qunar ойынға ұқсас цифрлық интерфейс арқылы нақты фермаға қатысуға мүмкіндік береді.",
      advantagePoint2Title: "Нақты әсер",
      advantagePoint2Desc:
        "Цифрлық ортадағы әрбір әрекет шынайы өсімдіктерге әсер етеді.",
      advantagePoint3Title: "Барлығына қолжетімді",
      advantagePoint3Desc:
        "Платформа фермерлерге де, қалалық тұрғындарға да қолайлы.",
      advantagePoint4Title: "Ашықтық және сенім",
      advantagePoint4Desc:
        "Пайдаланушы өсірудің толық процесін көріп, расталған деректер алады.",
      othersTag1: "Тек мониторинг",
      othersTag2: "Басқару жоқ",
      othersTag3: "Жабдық",
      advantageTag1: "Ойын + IoT",
      advantageTag2: "Live сенсорлар",
      advantageTag3: "Өнім жеткізу",
    },
  } as const;
  const competitionText = competitionCopy[language] ?? competitionCopy.en;
  const pricingBadge = {
    en: { entry: "Entry", best: "Best value", advanced: "Advanced", pro: "Pro farms" },
    ru: { entry: "Старт", best: "Лучшая цена", advanced: "Продвинутый", pro: "Профи" },
    kk: { entry: "Бастау", best: "Ең тиімді", advanced: "Кеңейтілген", pro: "Профи" },
  } as const;
  const badgeText = pricingBadge[language] ?? pricingBadge.en;
  const waitlistCopy = {
    en: {
      title: "Start growing your own food",
      subtitle: "Join the beta and become part of the first remote farming platform.",
      ctaPrimary: "Join Beta",
    },
    ru: {
      title: "Начните выращивать свою еду",
      subtitle: "Присоединяйтесь к бета‑версии и станьте частью первой удаленной фермы.",
      ctaPrimary: "Присоединиться",
    },
    kk: {
      title: "Өз тағамыңды өсір",
      subtitle: "Бетаға қосылып, алғашқы қашық ферма қауымдастығына кіріңіз.",
      ctaPrimary: "Қосылу",
    },
  } as const;
  const waitlistText = waitlistCopy[language] ?? waitlistCopy.en;
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
            <section className="relative overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
        <motion.div
          className="absolute -top-32 right-6 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, 12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl"
          animate={{ y: [0, 18, 0], x: [0, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/80 to-transparent dark:from-emerald-950/80" />
        <div className="container relative z-10 py-24 grid gap-12 lg:grid-cols-2 items-center">
          <motion.div variants={heroContainer} initial="hidden" animate="show" className="space-y-6">
            <motion.div
              variants={heroItem}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground"
            >
              {t("landing.hero.badge")}
            </motion.div>
            <motion.h1 variants={heroItem} className="text-4xl md:text-6xl font-bold text-gradient-primary text-glow mb-4 leading-[1.1] pb-1">
              {t("landing.hero.title")}
            </motion.h1>
            <motion.p variants={heroItem} className="text-lg text-muted-foreground">
              {t("landing.hero.subtitle")}
            </motion.p>
            <motion.div variants={heroItem} className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/register">{t("landing.hero.ctaPrimary")}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#demo">{t("landing.hero.ctaSecondary")}</a>
                </Button>
                <Button variant="ghost" asChild>
                  <a href="#waitlist">{t("landing.hero.ctaTertiary")}</a>
                </Button>
              </motion.div>
              <motion.div variants={heroItem} className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/80 border border-emerald-100 p-3 shadow-card">
                  <div className="text-xs text-muted-foreground">{t("landing.hero.stats.liveFarmsLabel")}</div>
                  <div className="text-lg font-semibold">{t("landing.hero.stats.liveFarmsValue")}</div>
                </div>
                <div className="rounded-xl bg-white/80 border border-emerald-100 p-3 shadow-card">
                  <div className="text-xs text-muted-foreground">{t("landing.hero.stats.sensorUptimeLabel")}</div>
                  <div className="text-lg font-semibold">{t("landing.hero.stats.sensorUptimeValue")}</div>
                </div>
                <div className="rounded-xl bg-white/80 border border-emerald-100 p-3 shadow-card">
                  <div className="text-xs text-muted-foreground">{t("landing.hero.stats.remoteActionsLabel")}</div>
                  <div className="text-lg font-semibold">{t("landing.hero.stats.remoteActionsValue")}</div>
                </div>
              </motion.div>
              <motion.div variants={heroItem} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100/90 text-amber-700 flex items-center justify-center shadow-card dark:bg-amber-500/10 dark:text-amber-300">
                  <Sun className="h-4 w-4" />
                </div>
                <div className="h-10 w-10 rounded-full bg-sky-100/90 text-sky-700 flex items-center justify-center shadow-card dark:bg-sky-500/10 dark:text-sky-300">
                  <Droplets className="h-4 w-4" />
                </div>
                <div className="h-10 w-10 rounded-full bg-lime-100/90 text-lime-700 flex items-center justify-center shadow-card dark:bg-lime-500/10 dark:text-lime-300">
                  <Sprout className="h-4 w-4" />
                </div>
              </motion.div>
            </motion.div>
          <motion.div
            variants={heroItem}
            initial="hidden"
            animate="show"
            className="relative bg-white/85 backdrop-blur rounded-2xl p-6 space-y-4 shadow-elevated border border-emerald-100 card-hover"
            whileInView={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute -top-4 right-6 rounded-full bg-emerald-600 text-white text-xs font-semibold px-3 py-1 shadow-card">
              {t("landing.hero.liveTag")}
            </div>
            <Stagger>
              <h3 className="font-semibold text-lg">{t("landing.hero.cardTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("landing.hero.cardDescription")}
              </p>
              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="rounded-xl border border-emerald-100 bg-white p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("landing.hero.metricSoil")}</span>
                    <span className="font-semibold text-emerald-700">62%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-emerald-100">
                    <div className="h-2 w-[62%] rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-white p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("landing.hero.metricTemp")}</span>
                    <span className="font-semibold text-emerald-700">24 C</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-emerald-100">
                    <div className="h-2 w-[74%] rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-white p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("landing.hero.metricStage")}</span>
                    <span className="font-semibold text-emerald-700">{t("landing.hero.metricStageValue")}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    {t("landing.hero.metricSync")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.hero.tagUnity")}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.hero.tagIot")}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.hero.tagAi")}</span>
              </div>
            </Stagger>
            </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white" id="problem">
        <Reveal className="container">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 text-xs px-3 py-1">
                {problemText.badge}
              </div>
              <h2 className="text-3xl font-bold">{problemText.title}</h2>
              <p className="text-muted-foreground">{problemText.subtitle}</p>
              <Stagger className="grid gap-4">
                <div className="rounded-2xl bg-card shadow-card p-4 flex gap-4">
                  <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center dark:bg-sky-500/10 dark:text-sky-300">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{problemText.cardCityTitle}</div>
                    <p className="text-sm text-muted-foreground">{problemText.cardCityDesc}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-card shadow-card p-4 flex gap-4">
                  <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center dark:bg-amber-500/10 dark:text-amber-300">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{problemText.cardTimeTitle}</div>
                    <p className="text-sm text-muted-foreground">{problemText.cardTimeDesc}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-card shadow-card p-4 flex gap-4">
                  <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center dark:bg-rose-500/10 dark:text-rose-300">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{problemText.cardTrustTitle}</div>
                    <p className="text-sm text-muted-foreground">{problemText.cardTrustDesc}</p>
                  </div>
                </div>
              </Stagger>
            </div>
            <div className="grid gap-4">
              <div className="rounded-2xl bg-emerald-600 text-white p-6 shadow-elevated">
                <div className="text-xs uppercase text-emerald-100">{macroText.title}</div>
                <div className="text-lg font-semibold">{macroText.subtitle}</div>
              </div>
              <Stagger className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-card shadow-card p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <TrendingUp className="h-4 w-4" />
                    {macroText.marketTitle}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{macroText.marketDesc}</p>
                </div>
                <div className="rounded-xl bg-card shadow-card p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Globe2 className="h-4 w-4" />
                    {macroText.urbanTitle}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{macroText.urbanDesc}</p>
                </div>
                <div className="rounded-xl bg-card shadow-card p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Leaf className="h-4 w-4" />
                    {macroText.organicTitle}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{macroText.organicDesc}</p>
                </div>
                <div className="rounded-xl bg-card shadow-card p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <BadgeCheck className="h-4 w-4" />
                    {macroText.trustTitle}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{macroText.trustDesc}</p>
                </div>
              </Stagger>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="py-16 bg-emerald-50/70" id="solution">
        <Reveal className="container grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 text-emerald-700 text-xs px-3 py-1">
              {t("landing.solution.badge")}
            </div>
            <h2 className="text-3xl font-bold">{t("landing.solution.title")}</h2>
            <p className="text-muted-foreground">{t("landing.solution.subtitle")}</p>
            <div className="rounded-2xl bg-white/80 border border-emerald-100 p-4 text-sm text-muted-foreground">
              {t("landing.solution.note")}
            </div>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute left-5 top-2 bottom-2 w-px bg-emerald-200" />
            <Stagger className="space-y-4">
              <div className="relative flex gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold">1</div>
                <div className="rounded-2xl bg-white shadow-card border border-emerald-100 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Sprout className="h-4 w-4" />
                    {t("landing.solution.step1Title")}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{t("landing.solution.step1Desc")}</p>
                </div>
              </div>
              <div className="relative flex gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold">2</div>
                <div className="rounded-2xl bg-white shadow-card border border-emerald-100 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Droplets className="h-4 w-4" />
                    {t("landing.solution.step2Title")}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{t("landing.solution.step2Desc")}</p>
                </div>
              </div>
              <div className="relative flex gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold">3</div>
                <div className="rounded-2xl bg-white shadow-card border border-emerald-100 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Activity className="h-4 w-4" />
                    {t("landing.solution.step3Title")}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{t("landing.solution.step3Desc")}</p>
                </div>
              </div>
              <div className="relative flex gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold">4</div>
                <div className="rounded-2xl bg-white shadow-card border border-emerald-100 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Camera className="h-4 w-4" />
                    {t("landing.solution.step4Title")}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{t("landing.solution.step4Desc")}</p>
                </div>
              </div>
              <div className="relative flex gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold">5</div>
                <div className="rounded-2xl bg-white shadow-card border border-emerald-100 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Truck className="h-4 w-4" />
                    {t("landing.solution.step5Title")}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{t("landing.solution.step5Desc")}</p>
                </div>
              </div>
            </Stagger>
          </div>
        </Reveal>
      </section>

      <section className="py-16 bg-white" id="technology">
        <Reveal className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
            <h2 className="text-3xl font-bold">{t("landing.technology.title")}</h2>
            <div className="text-sm text-muted-foreground">{t("landing.technology.subtitle")}</div>
          </div>
          <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-card shadow-card p-6 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <Cpu className="h-5 w-5" />
                {t("landing.technology.iotTitle")}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {t("landing.technology.iotDesc")}
              </p>
              <div className="flex flex-wrap gap-2 mt-4 text-xs text-muted-foreground">
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.iotTag1")}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.iotTag2")}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.iotTag3")}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-card shadow-card p-6 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <Gamepad2 className="h-5 w-5" />
                {t("landing.technology.gameTitle")}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {t("landing.technology.gameDesc")}
              </p>
              <div className="flex flex-wrap gap-2 mt-4 text-xs text-muted-foreground">
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.gameTag1")}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.gameTag2")}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.gameTag3")}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-card shadow-card p-6 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <Bot className="h-5 w-5" />
                {t("landing.technology.aiTitle")}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {t("landing.technology.aiDesc")}
              </p>
              <div className="flex flex-wrap gap-2 mt-4 text-xs text-muted-foreground">
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.aiTag1")}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.aiTag2")}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.aiTag3")}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-card shadow-card p-6 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <Camera className="h-5 w-5" />
                {t("landing.technology.liveTitle")}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {t("landing.technology.liveDesc")}
              </p>
              <div className="flex flex-wrap gap-2 mt-4 text-xs text-muted-foreground">
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.liveTag1")}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.liveTag2")}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1">{t("landing.technology.liveTag3")}</span>
              </div>
            </div>
          </Stagger>
        </Reveal>
      </section>

      <section className="py-16 bg-emerald-50/70" id="demo">
        <Reveal className="container grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-4">
              <h2 className="text-3xl font-bold">{t("landing.demo.title")}</h2>
              <p className="text-muted-foreground">{t("landing.demo.subtitle")}</p>
              <Button asChild>
                <a href="https://youtu.be/xWs9OQClSWg?si=gYnUc5s18K3fnZiY" target="_blank" rel="noreferrer">{t("landing.demo.button")}</a>
              </Button>
          </div>
          <div className="aspect-video rounded-2xl overflow-hidden shadow-elevated bg-black">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/xWs9OQClSWg"
              title={t("landing.demo.title")}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Reveal>
      </section>

      <section className="py-16 bg-emerald-50/70" id="business">
        <div className="container">
          <div className="flex flex-col gap-3 mb-8">
            <h2 className="text-3xl font-bold">{t("pricing.title")}</h2>
            <p className="text-muted-foreground">{t("pricing.subtitle")}</p>
            <div className="rounded-xl bg-white/70 border border-emerald-100 p-4 text-sm text-muted-foreground">
              {t("pricing.note")}
            </div>
          </div>
          <div className="md:hidden space-y-4">
            <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Simple</div>
                  <div className="text-lg font-semibold">4 990 ₸ / мес</div>
                </div>
                <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">{badgeText.entry}</span>
              </div>
              <p className="text-sm text-muted-foreground">Малые эксперименты</p>
              <ul className="space-y-2 text-sm">
                <Feature icon={Sprout}>Аренда до 3 культур</Feature>
                <Feature icon={Droplets}>Базовые датчики: влажность и температура</Feature>
                <Feature icon={Monitor}>Онлайн-мониторинг</Feature>
                <Feature icon={Bot}>AI-советы по уходу</Feature>
              </ul>
              <Button className="w-full" asChild>
                <Link to="/register">Подключиться</Link>
              </Button>
            </div>

            <div className="rounded-2xl bg-emerald-600 text-white p-5 shadow-elevated space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-emerald-100">Standard</div>
                  <div className="text-xl font-semibold">9 990 ₸ / мес</div>
                </div>
                <span className="rounded-full bg-white text-emerald-700 text-xs px-2 py-1">{badgeText.best}</span>
              </div>
              <p className="text-sm text-emerald-100">Активные пользователи</p>
              <ul className="space-y-2 text-sm">
                <Feature icon={Sprout} tone="light">Аренда до 4 культур</Feature>
                <Feature icon={Activity} tone="light">Расширенные датчики</Feature>
                <Feature icon={Camera} tone="light">Фотораспознавание болезней</Feature>
                <Feature icon={BookOpen} tone="light">Дневник роста и графики</Feature>
                <Feature icon={BarChart3} tone="light">Аналитика температуры и влажности</Feature>
                <Feature icon={Bot} tone="light">AI-советы и прогноз урожая</Feature>
                <Feature icon={Zap} tone="light">1 автоматизация (автополив)</Feature>
              </ul>
              <Button className="w-full" variant="secondary" asChild>
                <Link to="/register">Подключиться</Link>
              </Button>
            </div>

            <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Premium</div>
                  <div className="text-lg font-semibold">19 990 ₸ / мес</div>
                </div>
                <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">{badgeText.advanced}</span>
              </div>
              <p className="text-sm text-muted-foreground">Крупные участки</p>
              <ul className="space-y-2 text-sm">
                <Feature icon={Sprout}>Аренда до 5 культур</Feature>
                <Feature icon={Activity}>Расширенные датчики</Feature>
                <Feature icon={FileText}>История данных и отчеты</Feature>
                <Feature icon={Zap}>2 автоматизации</Feature>
                <Feature icon={Bot}>AI-советы и прогноз урожая</Feature>
                <Feature icon={BadgeCheck}>Приоритетная поддержка</Feature>
              </ul>
              <Button className="w-full" asChild>
                <Link to="/register">Подключиться</Link>
              </Button>
            </div>

            <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Pro</div>
                  <div className="text-lg font-semibold">39 990 ₸ / мес</div>
                </div>
                <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">{badgeText.pro}</span>
              </div>
              <p className="text-sm text-muted-foreground">Профессиональные фермеры</p>
              <ul className="space-y-2 text-sm">
                <Feature icon={Sprout}>Неограниченно культур</Feature>
                <Feature icon={Cpu}>Полный набор датчиков</Feature>
                <Feature icon={LineChart}>AI-аналитика и прогноз рисков</Feature>
                <Feature icon={FileText}>Детальные отчеты</Feature>
                <Feature icon={Zap}>Автоматизация без лимита</Feature>
                <Feature icon={Truck}>Бесплатная доставка оборудования</Feature>
              </ul>
              <Button className="w-full" asChild>
                <Link to="/register">Подключиться</Link>
              </Button>
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-0">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="text-left p-4">Тариф</th>
                  <th className="text-left p-4">Цена / мес</th>
                  <th className="text-left p-4">Подходит для</th>
                  <th className="text-left p-4">Основные функции</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="p-4 align-top border-t">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Simple</span>
                      <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">{badgeText.entry}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Малые эксперименты</div>
                  </td>
                  <td className="p-4 align-top border-t">
                    <div className="text-xl font-bold">4 990 ₸</div>
                    <Button size="sm" className="mt-3" asChild>
                      <Link to="/register">Подключиться</Link>
                    </Button>
                  </td>
                  <td className="p-4 align-top border-t text-muted-foreground">Дешевый вход в продукт.</td>
                  <td className="p-4 align-top border-t">
                    <ul className="space-y-2 text-sm">
                      <Feature icon={Sprout}>Аренда до 3 культур</Feature>
                      <Feature icon={Droplets}>Базовые датчики: влажность и температура</Feature>
                      <Feature icon={Monitor}>Онлайн-мониторинг</Feature>
                      <Feature icon={Bot}>AI-советы по уходу</Feature>
                    </ul>
                  </td>
                </tr>

                <tr className="bg-emerald-600 text-white">
                  <td className="p-4 align-top border-t border-emerald-500/40">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Standard</span>
                      <span className="rounded-full bg-white text-emerald-700 text-xs px-2 py-1">{badgeText.best}</span>
                    </div>
                    <div className="text-sm text-emerald-100">Активные пользователи</div>
                  </td>
                  <td className="p-4 align-top border-t border-emerald-500/40">
                    <div className="text-2xl font-bold">9 990 ₸</div>
                    <Button size="sm" variant="secondary" className="mt-3" asChild>
                      <Link to="/register">Подключиться</Link>
                    </Button>
                  </td>
                  <td className="p-4 align-top border-t border-emerald-500/40 text-emerald-100">
                    Реальная аналитика и контроль.
                  </td>
                  <td className="p-4 align-top border-t border-emerald-500/40">
                    <ul className="space-y-2 text-sm">
                      <Feature icon={Sprout} tone="light">Аренда до 4 культур</Feature>
                      <Feature icon={Activity} tone="light">Расширенные датчики</Feature>
                      <Feature icon={Camera} tone="light">Фотораспознавание болезней</Feature>
                      <Feature icon={BookOpen} tone="light">Дневник роста и графики</Feature>
                      <Feature icon={BarChart3} tone="light">Аналитика температуры и влажности</Feature>
                      <Feature icon={Bot} tone="light">AI-советы и прогноз урожая</Feature>
                      <Feature icon={Zap} tone="light">1 автоматизация (автополив)</Feature>
                    </ul>
                  </td>
                </tr>

                <tr className="bg-white">
                  <td className="p-4 align-top border-t">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Premium</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Крупные участки</div>
                  </td>
                  <td className="p-4 align-top border-t">
                    <div className="text-xl font-bold">19 990 ₸</div>
                    <Button size="sm" className="mt-3" asChild>
                      <Link to="/register">Подключиться</Link>
                    </Button>
                  </td>
                  <td className="p-4 align-top border-t text-muted-foreground">Почти полный контроль.</td>
                  <td className="p-4 align-top border-t">
                    <ul className="space-y-2 text-sm">
                      <Feature icon={Sprout}>Аренда до 5 культур</Feature>
                      <Feature icon={Activity}>Расширенные датчики</Feature>
                      <Feature icon={FileText}>История данных и отчеты</Feature>
                      <Feature icon={Zap}>2 автоматизации</Feature>
                      <Feature icon={Bot}>AI-советы и прогноз урожая</Feature>
                      <Feature icon={BadgeCheck}>Приоритетная поддержка</Feature>
                    </ul>
                  </td>
                </tr>

                <tr className="bg-white">
                  <td className="p-4 align-top border-t">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Pro</span>
                      <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">{badgeText.pro}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Профессиональные фермеры</div>
                  </td>
                  <td className="p-4 align-top border-t">
                    <div className="text-xl font-bold">39 990 ₸</div>
                    <Button size="sm" className="mt-3" asChild>
                      <Link to="/register">Подключиться</Link>
                    </Button>
                  </td>
                  <td className="p-4 align-top border-t text-muted-foreground">Полный контроль и масштаб.</td>
                  <td className="p-4 align-top border-t">
                    <ul className="space-y-2 text-sm">
                      <Feature icon={Sprout}>Неограниченно культур</Feature>
                      <Feature icon={Cpu}>Полный набор датчиков</Feature>
                      <Feature icon={LineChart}>AI-аналитика и прогноз рисков</Feature>
                      <Feature icon={FileText}>Детальные отчеты</Feature>
                      <Feature icon={Zap}>Автоматизация без лимита</Feature>
                      <Feature icon={Truck}>Бесплатная доставка оборудования</Feature>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-10 rounded-2xl bg-white/80 border border-emerald-100 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <h3 className="text-xl font-semibold">Как это работает</h3>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 text-xs px-3 py-1">
                <BadgeCheck className="h-4 w-4" />
                Аренда фермы + семена отдельно
              </div>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute left-0 right-0 top-6 h-px bg-emerald-200" />
              <div className="grid gap-4 md:grid-cols-5 text-sm">
                <div className="relative rounded-2xl bg-white p-4 shadow-card border border-emerald-100">
                  <div className="absolute -top-3 left-4 rounded-full bg-emerald-600 text-white text-xs font-bold px-2 py-1 shadow-card">
                    1
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <BadgeCheck className="h-4 w-4" />
                    Выбор тарифа
                  </div>
                  <p className="mt-2 text-muted-foreground">Вы выбираете тариф и арендуете место на ферме.</p>
                </div>
                <div className="relative rounded-2xl bg-white p-4 shadow-card border border-emerald-100">
                  <div className="absolute -top-3 left-4 rounded-full bg-emerald-600 text-white text-xs font-bold px-2 py-1 shadow-card">
                    2
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Sprout className="h-4 w-4" />
                    Покупка семян
                  </div>
                  <p className="mt-2 text-muted-foreground">Покупаете семена или саженцы через сервис.</p>
                </div>
                <div className="relative rounded-2xl bg-white p-4 shadow-card border border-emerald-100">
                  <div className="absolute -top-3 left-4 rounded-full bg-emerald-600 text-white text-xs font-bold px-2 py-1 shadow-card">
                    3
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Monitor className="h-4 w-4" />
                    Управление в игре
                  </div>
                  <p className="mt-2 text-muted-foreground">Контролируете растения через игру или Unity-интерфейс.</p>
                </div>
                <div className="relative rounded-2xl bg-white p-4 shadow-card border border-emerald-100">
                  <div className="absolute -top-3 left-4 rounded-full bg-emerald-600 text-white text-xs font-bold px-2 py-1 shadow-card">
                    4
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <LineChart className="h-4 w-4" />
                    Отчеты и прогнозы
                  </div>
                  <p className="mt-2 text-muted-foreground">Получаете отчеты, фото и прогнозы роста.</p>
                </div>
                <div className="relative rounded-2xl bg-white p-4 shadow-card border border-emerald-100">
                  <div className="absolute -top-3 left-4 rounded-full bg-emerald-600 text-white text-xs font-bold px-2 py-1 shadow-card">
                    5
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Truck className="h-4 w-4" />
                    Доставка урожая
                  </div>
                  <p className="mt-2 text-muted-foreground">Урожай доставляется к вам домой.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white" id="market">
        <Reveal className="container space-y-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 text-xs px-3 py-1">
              {competitionText.title}
            </div>
            <h2 className="text-3xl font-bold">{competitionText.title}</h2>
            <p className="text-muted-foreground">{competitionText.subtitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-card shadow-card p-6 border border-emerald-100">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 text-xs px-3 py-1">
                {competitionText.othersTitle}
              </div>
              <h3 className="text-2xl font-semibold mt-3">{competitionText.othersTitle}</h3>
              <p className="text-sm text-muted-foreground mt-2">{competitionText.othersIntro}</p>
              <div className="mt-5 space-y-4 text-sm">
                <div className="rounded-xl border border-emerald-100 bg-white/70 p-4">
                  <div className="font-semibold">{competitionText.othersPoint1Title}</div>
                  <p className="text-muted-foreground mt-1">{competitionText.othersPoint1Desc}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-white/70 p-4">
                  <div className="font-semibold">{competitionText.othersPoint2Title}</div>
                  <p className="text-muted-foreground mt-1">{competitionText.othersPoint2Desc}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-emerald-200 px-3 py-1">{competitionText.othersTag1}</span>
                <span className="rounded-full border border-emerald-200 px-3 py-1">{competitionText.othersTag2}</span>
                <span className="rounded-full border border-emerald-200 px-3 py-1">{competitionText.othersTag3}</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-emerald-600 text-white shadow-elevated p-6">
              <div className="absolute inset-0 bg-orbit opacity-70" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 text-emerald-50 text-xs px-3 py-1">
                  {competitionText.advantageTitle}
                </div>
                <h3 className="text-2xl font-semibold mt-3">{competitionText.advantageTitle}</h3>
                <p className="text-sm text-emerald-50 mt-2">{competitionText.subtitle}</p>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                    <div className="font-semibold">{competitionText.advantagePoint1Title}</div>
                    <p className="text-emerald-50 mt-1">{competitionText.advantagePoint1Desc}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                    <div className="font-semibold">{competitionText.advantagePoint2Title}</div>
                    <p className="text-emerald-50 mt-1">{competitionText.advantagePoint2Desc}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                    <div className="font-semibold">{competitionText.advantagePoint3Title}</div>
                    <p className="text-emerald-50 mt-1">{competitionText.advantagePoint3Desc}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                    <div className="font-semibold">{competitionText.advantagePoint4Title}</div>
                    <p className="text-emerald-50 mt-1">{competitionText.advantagePoint4Desc}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/15 px-3 py-1">{competitionText.advantageTag1}</span>
                  <span className="rounded-full bg-white/15 px-3 py-1">{competitionText.advantageTag2}</span>
                  <span className="rounded-full bg-white/15 px-3 py-1">{competitionText.advantageTag3}</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="py-16 bg-white" id="team">
        <Reveal className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold">{t("landing.team.title")}</h2>
              <p className="text-muted-foreground">{t("landing.team.subtitle")}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 text-xs px-3 py-1">
              {t("landing.team.badge")}
            </div>
          </div>
          <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-card shadow-card p-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">GZ</div>
                <div>
                  <div className="font-semibold">Gulnur Zhumakhan</div>
                  <div className="text-sm text-muted-foreground">{t("landing.team.roleCofounder")}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-card shadow-card p-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">FT</div>
                <div>
                  <div className="font-semibold">Fariza Turebayeva</div>
                  <div className="text-sm text-muted-foreground">{t("landing.team.roleFounder")}</div>
                </div>
              </div>
            </div>
          </Stagger>
        </Reveal>
      </section>

      <section className="py-16 bg-emerald-50/70" id="waitlist">
        <Reveal className="container text-center space-y-4">
          <h2 className="text-3xl font-bold">{waitlistText.title}</h2>
          <p className="text-muted-foreground">{waitlistText.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/register">{waitlistText.ctaPrimary}</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </main>
      <Footer />
    </div>
  );
};

export default Index;
