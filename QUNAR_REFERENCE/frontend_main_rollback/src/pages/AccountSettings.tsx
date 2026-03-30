import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPatch, API_PREFIX } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";

const AccountSettings = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiPatch(`${API_PREFIX}/users/me`, {
        full_name: fullName || null,
        phone: phone || null,
        email: email || null,
      });
      await refreshUser();
      toast.success(t("settingsPage.saved"));
    } catch (err: any) {
      toast.error(err.message || t("settingsPage.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="container py-8 max-w-2xl">
          <h1 className="text-3xl font-bold mb-8">{t("settingsPage.title")}</h1>
          <p className="text-xs text-muted-foreground mb-6">{t("settingsPage.description")}</p>

          <div className="space-y-8">
            <section className="p-6 rounded-xl bg-card shadow-card space-y-4">
              <h2 className="font-display font-semibold text-lg">{t("settingsPage.profileTitle")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input placeholder={t("settingsPage.fullName")} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input
                  placeholder={t("settingsPage.phone")}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? t("settingsPage.saving") : t("settingsPage.save")}
              </Button>
            </section>

            <section className="p-6 rounded-xl bg-card shadow-card space-y-4">
              <h2 className="font-display font-semibold text-lg">{t("settingsPage.subscriptionTitle")}</h2>
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent">
                <div>
                  <p className="font-semibold">
                    {t("settingsPage.subscriptionPlan", { plan: user?.subscription_type || "basic" })}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("settingsPage.subscriptionHint")}</p>
                </div>
                <Button variant="outline" onClick={() => toast.info(t("settingsPage.upgradeInfo"))}>
                  {t("settingsPage.upgrade")}
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountSettings;
