import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
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

const Subscriptions = () => {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const checkoutCopy = {
    en: { cta: "Proceed to checkout" },
    ru: { cta: "Перейти к оплате" },
    kk: { cta: "Төлемге өту" },
  } as const;
  const checkoutText = checkoutCopy[language] ?? checkoutCopy.en;

  const checkoutPath = (plan: string) => `/checkout?plan=${plan}`;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <section className="bg-hero-gradient">
          <div className="container py-16 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                {t("subscriptionsPage.badge")}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gradient-primary">{t("subscriptionsPage.title")}</h1>
              <p className="text-lg text-muted-foreground">{t("subscriptionsPage.subtitle")}</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to={user ? checkoutPath("standard") : "/register"}>
                    {user ? checkoutText.cta : t("subscriptionsPage.ctaPrimary")}
                  </Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl bg-card shadow-elevated p-6 space-y-4">
              <h3 className="font-semibold text-lg">{t("subscriptionsPage.includedTitle")}</h3>
              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="rounded-lg border p-4">{t("subscriptionsPage.includedItem1")}</div>
                <div className="rounded-lg border p-4">{t("subscriptionsPage.includedItem2")}</div>
                <div className="rounded-lg border p-4">{t("subscriptionsPage.includedItem3")}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-emerald-50/70" id="pricing">
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
                    <div className="text-xs uppercase text-muted-foreground">{t("pricing.planSimple")}</div>
                    <div className="text-lg font-semibold">{t("pricing.planSimplePrice")}</div>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">{t("pricing.badgeEntry")}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("pricing.planSimpleAudience")}</p>
                <ul className="space-y-2 text-sm">
                  <Feature icon={Sprout}>{t("pricing.planSimpleFeature1")}</Feature>
                  <Feature icon={Droplets}>{t("pricing.planSimpleFeature2")}</Feature>
                  <Feature icon={Monitor}>{t("pricing.planSimpleFeature3")}</Feature>
                  <Feature icon={Bot}>{t("pricing.planSimpleFeature4")}</Feature>
                </ul>
                <Button className="w-full" asChild>
                  <Link to={user ? checkoutPath("simple") : "/register"}>{t("pricing.cta")}</Link>
                </Button>
              </div>

              <div className="rounded-2xl bg-emerald-600 text-white p-5 shadow-elevated space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase text-emerald-100">{t("pricing.planStandard")}</div>
                    <div className="text-xl font-semibold">{t("pricing.planStandardPrice")}</div>
                  </div>
                  <span className="rounded-full bg-white text-emerald-700 text-xs px-2 py-1">{t("pricing.badgeBest")}</span>
                </div>
                <p className="text-sm text-emerald-100">{t("pricing.planStandardAudience")}</p>
                <ul className="space-y-2 text-sm">
                  <Feature icon={Sprout} tone="light">{t("pricing.planStandardFeature1")}</Feature>
                  <Feature icon={Activity} tone="light">{t("pricing.planStandardFeature2")}</Feature>
                  <Feature icon={Camera} tone="light">{t("pricing.planStandardFeature3")}</Feature>
                  <Feature icon={BookOpen} tone="light">{t("pricing.planStandardFeature4")}</Feature>
                  <Feature icon={BarChart3} tone="light">{t("pricing.planStandardFeature5")}</Feature>
                  <Feature icon={Bot} tone="light">{t("pricing.planStandardFeature6")}</Feature>
                  <Feature icon={Zap} tone="light">{t("pricing.planStandardFeature7")}</Feature>
                </ul>
                <Button className="w-full" variant="secondary" asChild>
                  <Link to={user ? checkoutPath("standard") : "/register"}>{t("pricing.cta")}</Link>
                </Button>
              </div>

              <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">{t("pricing.planPremium")}</div>
                    <div className="text-lg font-semibold">{t("pricing.planPremiumPrice")}</div>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">{t("pricing.badgeAdvanced")}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("pricing.planPremiumAudience")}</p>
                <ul className="space-y-2 text-sm">
                  <Feature icon={Sprout}>{t("pricing.planPremiumFeature1")}</Feature>
                  <Feature icon={Activity}>{t("pricing.planPremiumFeature2")}</Feature>
                  <Feature icon={FileText}>{t("pricing.planPremiumFeature3")}</Feature>
                  <Feature icon={Zap}>{t("pricing.planPremiumFeature4")}</Feature>
                  <Feature icon={Bot}>{t("pricing.planPremiumFeature5")}</Feature>
                  <Feature icon={BadgeCheck}>{t("pricing.planPremiumFeature6")}</Feature>
                </ul>
                <Button className="w-full" asChild>
                  <Link to={user ? checkoutPath("premium") : "/register"}>{t("pricing.cta")}</Link>
                </Button>
              </div>

              <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">{t("pricing.planPro")}</div>
                    <div className="text-lg font-semibold">{t("pricing.planProPrice")}</div>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">{t("pricing.badgePro")}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("pricing.planProAudience")}</p>
                <ul className="space-y-2 text-sm">
                  <Feature icon={Sprout}>{t("pricing.planProFeature1")}</Feature>
                  <Feature icon={Cpu}>{t("pricing.planProFeature2")}</Feature>
                  <Feature icon={LineChart}>{t("pricing.planProFeature3")}</Feature>
                  <Feature icon={FileText}>{t("pricing.planProFeature4")}</Feature>
                  <Feature icon={Zap}>{t("pricing.planProFeature5")}</Feature>
                  <Feature icon={Truck}>{t("pricing.planProFeature6")}</Feature>
                </ul>
                <Button className="w-full" asChild>
                  <Link to={user ? checkoutPath("pro") : "/register"}>{t("pricing.cta")}</Link>
                </Button>
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="text-left p-4">{t("pricing.tablePlan")}</th>
                    <th className="text-left p-4">{t("pricing.tablePrice")}</th>
                    <th className="text-left p-4">{t("pricing.tableAudience")}</th>
                    <th className="text-left p-4">{t("pricing.tableFeatures")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="p-4 align-top border-t">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{t("pricing.planSimple")}</span>
                        <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">{t("pricing.badgeEntry")}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{t("pricing.planSimpleAudience")}</div>
                    </td>
                    <td className="p-4 align-top border-t">
                      <div className="text-xl font-bold">{t("pricing.planSimplePrice")}</div>
                      <Button size="sm" className="mt-3" asChild>
                        <Link to={user ? checkoutPath("simple") : "/register"}>{t("pricing.cta")}</Link>
                      </Button>
                    </td>
                    <td className="p-4 align-top border-t text-muted-foreground">{t("pricing.planSimpleSummary")}</td>
                    <td className="p-4 align-top border-t">
                      <ul className="space-y-2 text-sm">
                        <Feature icon={Sprout}>{t("pricing.planSimpleFeature1")}</Feature>
                        <Feature icon={Droplets}>{t("pricing.planSimpleFeature2")}</Feature>
                        <Feature icon={Monitor}>{t("pricing.planSimpleFeature3")}</Feature>
                        <Feature icon={Bot}>{t("pricing.planSimpleFeature4")}</Feature>
                      </ul>
                    </td>
                  </tr>

                  <tr className="bg-emerald-600 text-white">
                    <td className="p-4 align-top border-t border-emerald-500/40">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{t("pricing.planStandard")}</span>
                        <span className="rounded-full bg-white text-emerald-700 text-xs px-2 py-1">{t("pricing.badgeBest")}</span>
                      </div>
                      <div className="text-sm text-emerald-100">{t("pricing.planStandardAudience")}</div>
                    </td>
                    <td className="p-4 align-top border-t border-emerald-500/40">
                      <div className="text-2xl font-bold">{t("pricing.planStandardPrice")}</div>
                      <Button size="sm" variant="secondary" className="mt-3" asChild>
                        <Link to={user ? checkoutPath("standard") : "/register"}>{t("pricing.cta")}</Link>
                      </Button>
                    </td>
                    <td className="p-4 align-top border-t border-emerald-500/40 text-emerald-100">
                      {t("pricing.planStandardSummary")}
                    </td>
                    <td className="p-4 align-top border-t border-emerald-500/40">
                      <ul className="space-y-2 text-sm">
                        <Feature icon={Sprout} tone="light">{t("pricing.planStandardFeature1")}</Feature>
                        <Feature icon={Activity} tone="light">{t("pricing.planStandardFeature2")}</Feature>
                        <Feature icon={Camera} tone="light">{t("pricing.planStandardFeature3")}</Feature>
                        <Feature icon={BookOpen} tone="light">{t("pricing.planStandardFeature4")}</Feature>
                        <Feature icon={BarChart3} tone="light">{t("pricing.planStandardFeature5")}</Feature>
                        <Feature icon={Bot} tone="light">{t("pricing.planStandardFeature6")}</Feature>
                        <Feature icon={Zap} tone="light">{t("pricing.planStandardFeature7")}</Feature>
                      </ul>
                    </td>
                  </tr>

                  <tr className="bg-white">
                    <td className="p-4 align-top border-t">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{t("pricing.planPremium")}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{t("pricing.planPremiumAudience")}</div>
                    </td>
                    <td className="p-4 align-top border-t">
                      <div className="text-xl font-bold">{t("pricing.planPremiumPrice")}</div>
                      <Button size="sm" className="mt-3" asChild>
                        <Link to={user ? checkoutPath("premium") : "/register"}>{t("pricing.cta")}</Link>
                      </Button>
                    </td>
                    <td className="p-4 align-top border-t text-muted-foreground">{t("pricing.planPremiumSummary")}</td>
                    <td className="p-4 align-top border-t">
                      <ul className="space-y-2 text-sm">
                        <Feature icon={Sprout}>{t("pricing.planPremiumFeature1")}</Feature>
                        <Feature icon={Activity}>{t("pricing.planPremiumFeature2")}</Feature>
                        <Feature icon={FileText}>{t("pricing.planPremiumFeature3")}</Feature>
                        <Feature icon={Zap}>{t("pricing.planPremiumFeature4")}</Feature>
                        <Feature icon={Bot}>{t("pricing.planPremiumFeature5")}</Feature>
                        <Feature icon={BadgeCheck}>{t("pricing.planPremiumFeature6")}</Feature>
                      </ul>
                    </td>
                  </tr>

                  <tr className="bg-white">
                    <td className="p-4 align-top border-t">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{t("pricing.planPro")}</span>
                        <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">{t("pricing.badgePro")}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{t("pricing.planProAudience")}</div>
                    </td>
                    <td className="p-4 align-top border-t">
                      <div className="text-xl font-bold">{t("pricing.planProPrice")}</div>
                      <Button size="sm" className="mt-3" asChild>
                        <Link to={user ? checkoutPath("pro") : "/register"}>{t("pricing.cta")}</Link>
                      </Button>
                    </td>
                    <td className="p-4 align-top border-t text-muted-foreground">{t("pricing.planProSummary")}</td>
                    <td className="p-4 align-top border-t">
                      <ul className="space-y-2 text-sm">
                        <Feature icon={Sprout}>{t("pricing.planProFeature1")}</Feature>
                        <Feature icon={Cpu}>{t("pricing.planProFeature2")}</Feature>
                        <Feature icon={LineChart}>{t("pricing.planProFeature3")}</Feature>
                        <Feature icon={FileText}>{t("pricing.planProFeature4")}</Feature>
                        <Feature icon={Zap}>{t("pricing.planProFeature5")}</Feature>
                        <Feature icon={Truck}>{t("pricing.planProFeature6")}</Feature>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Subscriptions;
