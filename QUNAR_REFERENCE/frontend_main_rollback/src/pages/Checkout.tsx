import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPost, API_PREFIX } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

type Message = {
  type: "error" | "success";
  text: string;
};

type PlanId = "simple" | "standard" | "premium" | "pro";

const Checkout = () => {
  const { refreshUser } = useAuth();
  const { language } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const initialPlan = (searchParams.get("plan") as PlanId) || "standard";
  const [plan, setPlan] = useState<PlanId>(initialPlan);

  const copy = {
    en: {
      title: "Checkout",
      subtitle: "Demo payment page. Card data is not stored.",
      planLabel: "Choose plan",
      cardTitle: "Card details",
      nameLabel: "Cardholder name",
      numberLabel: "Card number",
      expiryLabel: "Expiry",
      cvcLabel: "CVC",
      payButton: "Pay (demo)",
      back: "Back to subscriptions",
      success: "Payment completed. Subscription updated.",
      error: "Payment failed. Try again.",
    },
    ru: {
      title: "Оплата",
      subtitle: "Демо‑страница оплаты. Данные карты не сохраняются.",
      planLabel: "Выберите тариф",
      cardTitle: "Данные карты",
      nameLabel: "Имя владельца",
      numberLabel: "Номер карты",
      expiryLabel: "Срок",
      cvcLabel: "CVC",
      payButton: "Оплатить (демо)",
      back: "Назад к подпискам",
      success: "Оплата прошла. Подписка обновлена.",
      error: "Оплата не прошла. Попробуйте снова.",
    },
    kk: {
      title: "Төлем",
      subtitle: "Демо төлем беті. Карта деректері сақталмайды.",
      planLabel: "Тарифті таңдаңыз",
      cardTitle: "Карта деректері",
      nameLabel: "Иесінің аты",
      numberLabel: "Карта нөмірі",
      expiryLabel: "Мерзімі",
      cvcLabel: "CVC",
      payButton: "Төлеу (демо)",
      back: "Жазылымдарға қайту",
      success: "Төлем өтті. Жазылым жаңартылды.",
      error: "Төлем өтпеді. Қайта көріңіз.",
    },
  } as const;
  const text = copy[language] ?? copy.en;

  const plans = useMemo(
    () =>
      [
        { id: "simple", name: "Simple", price: "4 990 ₸" },
        { id: "standard", name: "Standard", price: "9 990 ₸" },
        { id: "premium", name: "Premium", price: "19 990 ₸" },
        { id: "pro", name: "Pro", price: "39 990 ₸" },
      ] as { id: PlanId; name: string; price: string }[],
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await apiPost(`${API_PREFIX}/billing/checkout/demo`, { plan }, true);
      await refreshUser();
      setMessage({ type: "success", text: text.success });
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || text.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="container py-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl bg-card shadow-card p-6 space-y-4">
            <h1 className="text-3xl font-bold">{text.title}</h1>
            <p className="text-muted-foreground">{text.subtitle}</p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium">{text.planLabel}</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {plans.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setPlan(item.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        plan === item.id
                          ? "border-emerald-500 bg-emerald-50/70 text-emerald-700"
                          : "border-input hover:border-emerald-300"
                      }`}
                    >
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-4 space-y-3">
                <div className="font-semibold">{text.cardTitle}</div>
                <Input placeholder={text.nameLabel} />
                <Input placeholder={text.numberLabel} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder={text.expiryLabel} />
                  <Input placeholder={text.cvcLabel} />
                </div>
              </div>

              <Button type="submit" disabled={loading}>
                {text.payButton}
              </Button>
            </form>
            {message && (
              <div className={`text-sm ${message.type === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                {message.text}
              </div>
            )}
            <Link to="/subscriptions" className="text-sm text-muted-foreground hover:text-foreground">
              {text.back}
            </Link>
          </div>

          <div className="rounded-2xl bg-emerald-600 text-white p-6 shadow-elevated space-y-3">
            <div className="text-xs uppercase text-emerald-100">Summary</div>
            <div className="text-2xl font-semibold">{plans.find((p) => p.id === plan)?.name}</div>
            <div className="text-emerald-50">{plans.find((p) => p.id === plan)?.price}</div>
            <div className="rounded-xl bg-white/10 p-4 text-sm text-emerald-50">
              Demo checkout updates subscription instantly. No real charges.
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
