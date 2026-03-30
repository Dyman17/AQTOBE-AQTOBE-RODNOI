import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { apiGet, API_PREFIX } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [farms, setFarms] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(
    () => ({
      farms: farms.length,
      plants: plants.length,
      sensors: sensors.length,
    }),
    [farms, plants, sensors]
  );

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const farmsResp = await apiGet<any[]>(`${API_PREFIX}/farms`);
      const plantsResp = await apiGet<any[]>(`${API_PREFIX}/plants`);
      const sensorsResp = await apiGet<any[]>(`${API_PREFIX}/sensors`);
      setFarms(farmsResp.data || []);
      setPlants(plantsResp.data || []);
      setSensors(sensorsResp.data || []);
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">{t("dashboardPage.title")}</h1>
              <p className="text-muted-foreground">{t("dashboardPage.welcome", { name: user?.full_name || user?.email || "" })}</p>
              <p className="text-xs text-muted-foreground">{t("dashboardPage.hintReload")}</p>
            </div>
            <Button onClick={loadDashboard} disabled={loading}>
              {loading ? t("common.loading") : t("common.reload")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-card shadow-card">
              <div className="text-sm text-muted-foreground">{t("dashboardPage.totalsFarms")}</div>
              <div className="text-2xl font-bold">{totals.farms}</div>
            </div>
            <div className="p-4 rounded-xl bg-card shadow-card">
              <div className="text-sm text-muted-foreground">{t("dashboardPage.totalsPlants")}</div>
              <div className="text-2xl font-bold">{totals.plants}</div>
            </div>
            <div className="p-4 rounded-xl bg-card shadow-card">
              <div className="text-sm text-muted-foreground">{t("dashboardPage.totalsSensors")}</div>
              <div className="text-2xl font-bold">{totals.sensors}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-card shadow-card">
              <h2 className="font-semibold mb-4">{t("dashboardPage.yourFarms")}</h2>
              {farms.length === 0 && <div className="text-sm text-muted-foreground">{t("dashboardPage.noFarms")}</div>}
              <div className="space-y-3">
                {farms.map((farm) => (
                  <div key={farm.id} className="border rounded-lg p-3">
                    <div className="font-semibold">{farm.name}</div>
                    <div className="text-sm text-muted-foreground">{t("dashboardPage.size")}: {farm.size}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 rounded-xl bg-card shadow-card">
              <h2 className="font-semibold mb-4">{t("dashboardPage.latestPlants")}</h2>
              {plants.length === 0 && <div className="text-sm text-muted-foreground">{t("dashboardPage.noPlants")}</div>}
              <div className="space-y-3">
                {plants.slice(0, 6).map((plant) => (
                  <div key={plant.id} className="border rounded-lg p-3">
                    <div className="font-semibold">{plant.crop_type}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("dashboardPage.progress")}: {plant.progress}% · {t(`plantsPage.status.${plant.status}`) === `plantsPage.status.${plant.status}` ? plant.status : t(`plantsPage.status.${plant.status}`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && <div className="text-sm text-destructive mt-4">{error}</div>}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
